/**
 * 統一的環境檢測工具
 * 所有環境判斷都應該使用這個模組，確保一致性
 *
 * 注意：此檔案用於 runtime 環境檢測（Chrome Extension、瀏覽器）
 * 對於 Vite 打包的程式碼，應直接使用 process.env.NODE_ENV
 * 因為 Vite 會在 build time 替換該值
 */

// 宣告 process 型別以避免 TypeScript 錯誤
declare const process: { env: Record<string, string | undefined> } | undefined;

/**
 * 安全的跨環境開發模式檢測
 * 支援 Chrome Extension 和瀏覽器環境
 */
export function getDevMode(): boolean {
  // Chrome Extension 環境檢查
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
    try {
      const manifest = chrome.runtime.getManifest();
      // 開發模式的 extension 沒有 update_url
      // 生產模式（從 Chrome Web Store 安裝）有 update_url
      return !('update_url' in manifest);
    } catch {
      return true;
    }
  }

  // 瀏覽器環境檢查 - 檢查常見的開發標識
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.endsWith('.local')
    );
  }

  // 默認為生產環境（安全策略）
  return false;
}

/**
 * 是否為開發環境
 * 在模組載入時計算一次，之後使用快取值
 */
export const isDev: boolean = getDevMode();

/**
 * 是否為生產環境
 */
export const isProduction: boolean = !isDev;
