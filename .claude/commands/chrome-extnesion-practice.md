# Chrome Extension 開發最佳實踐指南

## 🔐 安全性（Security）

### 強制使用 Manifest V3
最新標準禁止遠端程式碼執行，也禁用 eval()、new Function()，降低XSS風險。

### Content Security Policy (CSP) 配置
限制非信任腳本及樣式來源，避免 inline script，強化防護。

### 權限最小化
只申請必要權限（如 tabs, storage），避免過度權限造成的安全漏洞。

### 避免動態執行程式碼
不使用 eval 與動態字串解析，且警戒如 React 的 dangerouslySetInnerHTML，防止注入攻擊。

### 禁止 inline script
所有腳本應以獨立檔案引入，避免 CSP 違規與安全風險。

## ⚙️ 結構與可維護性（Architecture & Maintainability）

### 模組區分清晰
按功能分 /popup, /background, /content-scripts, /options, /shared 等。

### 共用邏輯集中管理
將 chrome.runtime.sendMessage、chrome.storage 封裝成工具 (utils)，降低重複代碼。

### 強制靜態型別檢查
使用 TypeScript 或 JSDoc 標註型別，有助於穩定性與團隊協作。

### 明確標註檔案角色
文檔或註解標明背景腳本、內容腳本、UI組件等位置與功能。

## ⚡️ 效能優化（Performance）

### 避免持續監聽 DOM
若用 MutationObserver，務必加條件過濾，避免頻繁觸發影響速度。

### 懶載入 UI 資源
使用 dynamic import 或 React.lazy 按需載入，降低啟動時間。

### 背景腳本負載控制
MV3 service worker 會自動回收，避免長時間運算導致資源浪費。

## 🔄 資料流與通訊（Data Flow & Messaging）

### 封裝 Message API
使用統一的 sendMessage/onMessage 介面，統一錯誤處理和型別管理。

### 明確定義 Message Type
用 enum 或常數管理 message type，防止硬編碼字串錯誤。

### 區分背景與頁面訊息
正確使用 chrome.runtime.sendMessage 與 chrome.tabs.sendMessage，確保通訊路徑正確。

## 🧪 測試與開發流程（Dev & QA）

### 靜態檢查與自動化
ESLint、Prettier、TypeScript typecheck 加入開發流程。

### 利用工具自動生成 manifest.json
以 webpack/Vite plugin 管理 manifest，減少手動出錯。

### 定期手動測試
測試覆蓋各種安裝、重啟、不同網頁場景。

### 使用 Chrome DevTools Extension 專用面板輔助除錯

## 🌐 相容性與上架注意事項（Deployment）

### 嚴格遵守 Chrome Web Store 政策
不收集或追蹤使用者隱私，不注入廣告。

### 明確版本號與更新紀錄
manifest.json 清楚紀錄版本，方便審核與用戶追蹤。

### 提供詳細描述與圖片
上架時需清楚說明功能與操作，提升用戶信任度。

## 📁 範例目錄結構（推薦）

```
my-extension/
├── public/
│   └── icons/
├── src/
│   ├── background/
│   ├── content/
│   ├── popup/
│   ├── options/
│   ├── shared/
│   └── manifest.ts
├── manifest.json
├── package.json
└── vite.config.ts
```

## 📦 專案架構特定建議（基於 Monorepo 結構）

### 使用 Turborepo 管理 monorepo
區分各模組責任，共用邏輯放在 `shared` 包。

### 統一管理 Chrome Storage API
使用 `storage` 包封裝所有儲存操作。

### Content script 和 UI 分離
content 負責邏輯，content-ui 負責界面呈現。

## 🔑 身份驗證與 Content Script 安全建議

### 登入狀態管理
使用 chrome.storage.local 持久化登入狀態，背景頁統一管理 API 請求。

### 動態介面調整
根據登入狀態動態顯示/隱藏功能，處理登出情境清除敏感資料。

### Content Script 安全注入
驗證目標元素安全性，避免注入敏感頁面，使用 safetyManager 檢查執行環境。

### 小心處理 contentEditable 元素
注意選擇範圍操作的安全性與正確性。

## 🛠️ 推薦工具與腳本

### 開發階段
- `pnpm dev` - 熱重載開發
- `pnpm lint` - 程式碼檢查
- `pnpm type-check` - 型別檢查
- `pnpm e2e` - 自動化測試

### 除錯工具
- Chrome DevTools Extension 面板
- chrome://extensions/ 開發者模式

## 📋 Code Review 檢查清單

### 🔐 安全檢查
- [ ] manifest.json 權限最小化（僅包含必要權限）
- [ ] 無硬編碼 API endpoints 或敏感資訊
- [ ] Content script 有安全性檢查機制
- [ ] CSP 設定符合 MV3 要求
- [ ] 無使用 eval 或動態程式碼執行

### ⚙️ 架構檢查
- [ ] 各模組職責清晰（background/content/ui 分離）
- [ ] 共用邏輯抽取到 shared 包
- [ ] TypeScript 型別定義完整
- [ ] Message passing 有錯誤處理
- [ ] 檔案角色標註清楚

### ⚡️ 效能檢查
- [ ] Content script 不會阻塞頁面載入
- [ ] React 元件使用 lazy loading
- [ ] 避免不必要的 DOM 查詢
- [ ] Service worker 生命週期管理得當
- [ ] MutationObserver 有適當條件過濾

### 🧪 品質檢查
- [ ] 通過 ESLint 和 TypeScript 檢查
- [ ] 關鍵功能有 e2e 測試覆蓋
- [ ] 在不同瀏覽器測試過
- [ ] 處理各種邊界情況
- [ ] 有適當的錯誤處理機制

### 🌐 上架準備檢查
- [ ] manifest 有正確描述和版本號
- [ ] 圖標與說明符合 Chrome Web Store 政策
- [ ] 無追蹤用戶隱私或注入廣告行為
- [ ] 提供清楚的使用說明

## 📌 快速 Review Checklist 總表

| 類別 | 檢查項目 |
|------|----------|
| 安全 | CSP 設定完善 • 無 eval 或 inline script • 權限最小化 |
| 架構 | 資料夾劃分清楚 • 重複邏輯已封裝 • 避免跨模組耦合 |
| 效能 | 懶載入重資源 • content script 不會造成卡頓 |
| 資料流 | Messaging 處理有錯誤回傳 • message type 有 enum 管理 |
| 維護 | 使用 TypeScript 或 JSDoc • ESLint/Prettier 套用一致 |
| 上架 | manifest 有正確描述 • 圖標與說明符合政策 |