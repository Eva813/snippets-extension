# Chrome 擴充功能上架流程指南

此文件說明如何為 Chrome 擴充功能創建乾淨的上架版本，確保沒有開發用代碼（如 HMR WebSocket 連接）。

## 前置條件
- Node.js 版本 >= 20（推薦使用 v22.12.0）
- pnpm 已安裝並更新至最新版本
- 位於專案根目錄 `/Users/Eva/snippets-extension`

---

## 🤖 Claude Code 自動化執行流程

**當用戶要求「建立 ZIP 檔案」或「打包上架」時，請依序執行以下命令：**

### 步驟 1: 清理舊文件和快取
```bash
pnpm clean
```
**預期結果：** 清除 dist/, .turbo/, node_modules/

---

### 步驟 2: 安裝依賴（必須執行）
```bash
pnpm install
```
**預期結果：** 所有依賴安裝完成，顯示 "Done in Xs"

---

### 步驟 3: 生產構建（重要：不要使用 pnpm dev）
```bash
pnpm build
```
**預期結果：** 構建成功，dist 目錄包含所有編譯後的文件

---

### 步驟 4: 驗證生產構建
```bash
node scripts/verify-production-build.js
```
**必須通過驗證，期望輸出：**
```
🔍 驗證生產構建...
✅ 生產構建驗證通過！沒有發現開發用的代碼。
🚀 可以安全地用於生產環境或上架。
```

---

### 步驟 5: 檢查版本號
```bash
grep '"version"' dist/manifest.json
```
**預期輸出範例：** `"version": "1.4.2",` （這是會變更的）

---

### 步驟 6: 創建帶版本號的 ZIP 檔案
```bash
# 取得版本號
VERSION=$(grep '"version"' dist/manifest.json | sed 's/.*"version": "\([^"]*\)".*/\1/')

# 創建 ZIP（檔名包含版本號）
cd dist && zip -r "../extension-v${VERSION}.zip" * && cd ..
```
**預期結果：** 生成 `extension-v1.4.2.zip` (版本號會自動從 manifest.json 讀取)

---

### 步驟 7: 確認 ZIP 檔案已創建
```bash
ls -lh extension-v*.zip
```
**預期輸出：** 顯示檔案名稱和大小，例如 `extension-v1.4.2.zip`

---

## 🚀 手動執行流程

### 1️⃣ 準備階段

```bash
# 確保在專案根目錄
cd /Users/Eva/snippets-extension

# 更新版本號
# 手動編輯 package.json 中的 "version" 欄位
# 例如：從 "1.4.1" 改為 "1.4.2"
```

### 2️⃣ 清理與構建

```bash
# 完全清理舊文件和快取
pnpm clean

# 安裝依賴（必須執行）
pnpm install

# 生產構建（重要：不要使用 pnpm dev）
pnpm build
```

### 3️⃣ 驗證構建

```bash
# 驗證沒有開發用代碼
node scripts/verify-production-build.js
```

**期望輸出：**
```
🔍 驗證生產構建...
✅ 生產構建驗證通過！沒有發現開發用的代碼。
🚀 可以安全地用於生產環境或上架。
```

### 4️⃣ 檢查版本號

```bash
# 確認 manifest.json 中的版本號正確
grep '"version"' dist/manifest.json
```

**期望輸出範例：**
```
"version": "1.4.2",
```

### 5️⃣ 創建上架 ZIP（帶版本號）

```bash
# 取得版本號並創建 ZIP
VERSION=$(grep '"version"' dist/manifest.json | sed 's/.*"version": "\([^"]*\)".*/\1/')
cd dist && zip -r "../extension-v${VERSION}.zip" * && cd ..
```

### 6️⃣ 最終確認

```bash
# 檢查 zip 文件
ls -lh extension-v*.zip
```

## 🤖 一鍵自動化腳本

創建 `create-release.sh` 腳本：

```bash
#!/bin/bash
# Chrome 擴充功能上架版本創建腳本

echo "🚀 開始建立上架版本..."

# 檢查是否在正確目錄
if [[ ! -f "package.json" ]]; then
    echo "❌ 請在專案根目錄執行此腳本"
    exit 1
fi

# 1. 清理並構建
echo "📦 清理並構建..."
pnpm clean && pnpm install && pnpm build

if [[ $? -ne 0 ]]; then
    echo "❌ 構建失敗"
    exit 1
fi

# 2. 驗證構建
echo "🔍 驗證構建..."
if node scripts/verify-production-build.js; then
    echo "✅ 構建驗證通過"
else
    echo "❌ 構建驗證失敗，請檢查錯誤"
    exit 1
fi

# 3. 顯示版本號
echo "📋 當前版本："
VERSION=$(grep '"version"' dist/manifest.json | sed 's/.*"version": "\([^"]*\)".*/\1/')
echo "Version: $VERSION"

# 4. 創建 ZIP（帶版本號）
echo "📦 創建 ZIP 文件..."
cd dist
zip -r "../extension-v${VERSION}.zip" *
cd ..

# 5. 完成
if [[ -f "extension-v${VERSION}.zip" ]]; then
    echo "🎉 上架文件已準備完成：extension-v${VERSION}.zip"
    echo "📁 文件大小：$(ls -lh "extension-v${VERSION}.zip" | awk '{print $5}')"
    echo ""
    echo "📋 接下來的步驟："
    echo "1. 測試 extension-v${VERSION}.zip 在本地 Chrome"
    echo "2. 上傳到 Chrome Web Store"
    echo "3. 備份此版本的 zip 文件"
else
    echo "❌ ZIP 文件創建失敗"
    exit 1
fi
```

### 使用自動化腳本：

```bash
# 賦予執行權限（只需執行一次）
chmod +x create-release.sh

# 執行腳本
./create-release.sh
```

## ⚠️ 重要注意事項

### 必須手動操作的步驟
1. **更新版本號**：每次上架前必須手動編輯 `package.json` 中的 `version` 欄位
2. **測試功能**：上架前在本地 Chrome 測試解壓後的擴充功能

### 常見錯誤預防
1. **❌ 不要使用 `pnpm dev`** - 這會包含 HMR 代碼
2. **✅ 一定要運行 `pnpm build`** - 這是乾淨的生產構建
3. **✅ 必須通過驗證腳本** - 確保沒有 WebSocket 錯誤
4. **✅ 檢查版本號** - 確認 manifest.json 版本正確

### 驗證腳本檢查項目
- ❌ `localhost:8081` WebSocket 連接
- ❌ `initClient` 函數
- ❌ `addRefresh` 函數  
- ❌ `refresh.js` 文件
- ❌ HMR 相關代碼

## 📁 文件結構

上架 ZIP 應包含：
```
extension.zip
├── manifest.json          (版本號正確)
├── background.iife.js     (背景腳本)
├── content/               (內容腳本)
├── content-ui/            (UI 組件)
├── popup/                 (彈出視窗)
├── side-panel/            (側邊面板)
├── options/               (設定頁面)
├── devtools/              (開發者工具)
├── new-tab/               (新分頁)
├── _locales/              (多語言)
└── *.png                  (圖標文件)
```

## 🔧 故障排除

### 如果驗證失敗：
1. 確保沒有使用 `pnpm dev` 構建
2. 執行 `pnpm clean` 清理所有快取
3. 重新執行 `pnpm build`
4. 檢查是否有環境變數 `__DEV__=true`

### 如果版本號不正確：
1. 檢查 `package.json` 中的版本
2. 確認 `chrome-extension/manifest.js` 正確讀取版本號
3. 重新執行構建流程

## 📞 支援

如遇到問題，請檢查：
1. Node.js 版本 >= 20
2. pnpm 版本是否最新
3. 所有依賴是否正確安裝

---

*最後更新：2025-12-20*
*此指南確保每次上架都能創建乾淨、無錯誤的 Chrome 擴充功能。*