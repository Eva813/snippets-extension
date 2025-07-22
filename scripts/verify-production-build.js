#!/usr/bin/env node

/**
 * 驗證生產構建是否乾淨，沒有開發用的 HMR 代碼
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

function verifyProductionBuild() {
  console.log('🔍 驗證生產構建...');

  const errors = [];

  // 1. 檢查 manifest.json
  const manifestPath = path.join(distDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    errors.push('❌ manifest.json 不存在');
  } else {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // 檢查是否包含 refresh.js
    const hasRefreshScript = manifest.content_scripts?.some(script => script.js?.includes('refresh.js'));

    if (hasRefreshScript) {
      errors.push('❌ manifest.json 包含開發用的 refresh.js content script');
    }
  }

  // 2. 檢查是否存在 refresh.js 文件
  const refreshJsPath = path.join(distDir, 'refresh.js');
  if (fs.existsSync(refreshJsPath)) {
    errors.push('❌ 發現開發用的 refresh.js 文件');
  }

  // 3. 檢查所有 .js 文件中是否包含 HMR 代碼
  function checkJSFiles(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        checkJSFiles(filePath);
      } else if (file.endsWith('.js')) {
        const content = fs.readFileSync(filePath, 'utf8');

        // 檢查 HMR 相關代碼
        const hmrPatterns = ['localhost:8081', 'LOCAL_RELOAD_SOCKET_URL', 'initClient', 'addRefresh', '__HMR_ID'];

        for (const pattern of hmrPatterns) {
          if (content.includes(pattern)) {
            const relativePath = path.relative(distDir, filePath);
            errors.push(`❌ ${relativePath} 包含 HMR 代碼: "${pattern}"`);
          }
        }
      }
    }
  }

  if (fs.existsSync(distDir)) {
    checkJSFiles(distDir);
  } else {
    errors.push('❌ dist 目錄不存在');
  }

  // 報告結果
  if (errors.length === 0) {
    console.log('✅ 生產構建驗證通過！沒有發現開發用的代碼。');
    console.log('🚀 可以安全地用於生產環境或上架。');
  } else {
    console.log('❌ 生產構建驗證失敗！發現以下問題：');
    errors.forEach(error => console.log(`  ${error}`));
    console.log('\n💡 建議：');
    console.log('  1. 確保使用 "pnpm build" 而不是 "pnpm dev" 進行構建');
    console.log('  2. 運行 "pnpm clean && pnpm build" 重新構建');
    console.log('  3. 檢查環境變數 __DEV__ 沒有被設置為 true');
    process.exit(1);
  }
}

verifyProductionBuild();
