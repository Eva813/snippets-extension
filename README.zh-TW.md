# PromptBear Chrome Extension

<div align="center">

![](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![](https://img.shields.io/badge/Typescript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![](https://badges.aleen42.com/src/vitejs.svg)
![](https://img.shields.io/badge/Chrome_Extension-MV3-green?style=flat-square)

**語言選擇**: [English](README.md) | [繁體中文](README.zh-TW.md)

</div>

## 專案介紹

PromptBear 是一款強大的生產力 Chrome 擴展程式，專門用於管理和插入文本片段（代碼片段）。它允許用戶通過自定義快捷鍵快速插入預定義的文本內容到任何網頁中，大大提升工作效率。

### 核心功能

- **智能文本插入**: 支援在任何網頁中快速插入文本片段
- **自定義快捷鍵**: 為每個片段設定獨特的快捷鍵組合
- **文件夾管理**: 組織化管理你的代碼片段和文本模板
- **共享文件夾**: 與團隊成員共享片段，支援權限管理
- **智能表單**: 支援動態表單，可在插入時填入變數
- **雲端同步**: 與 PromptBear 平台無縫整合，雲端儲存和同步
- **右鍵選單**: 選取文本後可直接添加到 PromptBear 平台
- **側邊欄管理**: 便捷的側邊欄界面管理所有片段

### 使用場景

- **程式開發**: 快速插入常用代碼模板、函數片段
- **客服回覆**: 標準化客服回覆模板
- **郵件範本**: 常用郵件格式和簽名
- **社群媒體**: 預設回覆內容和標籤

## 🏗️ 技術架構

本專案採用現代化的前端技術堆疊，基於 Chrome Extension Manifest V3 規範：

### 核心技術

- **Framework**: React 18.3.1 + TypeScript 5.5.4
- **Build Tool**: Vite 6.0.5 + Turborepo 2.3.3
- **UI Framework**: Tailwind CSS 3.4.14
- **Content Editor**: TipTap 2.26.1 (富文本編輯)
- **Package Manager**: pnpm 9.15.1 (Monorepo 管理)

### 專案結構

```
snippets-extension/
├── chrome-extension/          # 擴展核心
│   ├── src/background/        # Background Script (Service Worker)
│   ├── manifest.js           # Manifest 配置
│   └── public/               # 靜態資源 (圖標等)
├── pages/                    # 各種頁面組件
│   ├── content/              # Content Script (核心插入邏輯)
│   ├── content-ui/           # 側邊欄 UI 界面
│   ├── popup/                # 彈出視窗
│   ├── options/              # 設定頁面
│   ├── side-panel/           # 側邊面板
│   └── ...                   # 其他頁面
├── packages/                 # 共享套件
│   ├── shared/               # 共享工具和類型
│   ├── storage/              # 儲存管理
│   ├── i18n/                 # 國際化
│   └── ...                   # 其他套件
└── tests/                    # E2E 測試
```

## 📦 安裝與開發

### 系統需求

- Node.js >= 20
- pnpm >= 9.15.1
- Chrome/Firefox 瀏覽器

### 開發環境設置

1. **專案**
```bash
git clone https://github.com/Eva813/snippets-extension.git
cd snippets-extension
```

2. **安裝依賴**
```bash
# 安裝 pnpm (如果尚未安裝)
npm install -g pnpm

# 安裝專案依賴
pnpm install
```

3. **開發模式**
```bash
# Chrome 開發
pnpm dev

# Firefox 開發
pnpm dev:firefox
```

4. **載入擴展程式**

**Chrome:**
1. 開啟 `chrome://extensions`
2. 啟用「開發者模式」
3. 點擊「載入未封裝項目」
4. 選擇 `dist` 資料夾

**Firefox:**
1. 開啟 `about:debugging#/runtime/this-firefox`
2. 點擊「載入暫時附加元件」
3. 選擇 `dist/manifest.json` 檔案

### 生產環境建置

```bash
# Chrome 建置
pnpm build

# Firefox 建置
pnpm build:firefox

# 建置並打包 ZIP
pnpm zip
```

## 主要功能模組

### 1. Content Script 系統
- **檔案位置**: `pages/content/`
- **功能**: 負責在網頁中插入文本片段
- **核心檔案**:
  - `input/inputHandler.ts`: 處理各種輸入欄位
  - `cursor/cursorTracker.ts`: 游標位置追蹤
  - `prompt/promptManager.ts`: 片段快取管理

### 2. Background Script
- **檔案位置**: `chrome-extension/src/background/`
- **功能**: 擴展的核心邏輯，API 通訊
- **主要功能**:
  - 用戶登入狀態管理
  - API 請求處理
  - 右鍵選單功能
  - 片段資料同步

### 3. 側邊欄 UI
- **檔案位置**: `pages/content-ui/`
- **功能**: 提供視覺化片段管理界面
- **特色**:
  - 文件夾瀏覽
  - 片段搜尋
  - 共享文件夾管理
  - 即時插入預覽

### 4. 共享功能系統
- **功能**: 支援團隊協作的片段共享
- **權限管理**: 檢視/編輯權限控制
- **API 整合**: 與 PromptBear 平台無縫整合

## 🛠️ 開發指令

```bash
# 開發相關
pnpm dev                    # 啟動 Chrome 開發模式
pnpm dev:firefox           # 啟動 Firefox 開發模式

# 建置相關
pnpm build                 # 生產建置 (Chrome)
pnpm build:firefox         # 生產建置 (Firefox)
pnpm zip                   # 建置並打包 ZIP

# 程式碼品質
pnpm lint                  # ESLint 檢查
pnpm lint:fix              # 自動修復 ESLint 問題
pnpm prettier              # Prettier 格式化
pnpm type-check            # TypeScript 類型檢查

# 測試
pnpm e2e                   # E2E 測試
pnpm e2e:firefox           # Firefox E2E 測試

# 清理
pnpm clean                 # 清理所有建置檔案
pnpm clean:install         # 重新安裝依賴
```

## API 整合

本擴展程式與 PromptBear 平台 (`https://promptbear.ai`) 整合：

### 主要 API 端點
- **用戶認證**: `/api/auth/*`
- **片段管理**: `/api/v1/prompts/*`
- **文件夾管理**: `/api/v1/folders/*`
- **共享功能**: `/api/v1/shared-folders/*`

### 環境配置
創建 `.env` 檔案設定環境變數：
```bash
VITE_API_DOMAIN=https://promptbear.ai
VITE_VERCEL_PREVIEW_BYPASS=your_bypass_token
```

## 部署與發佈

### 自動化部署
專案配置了 GitHub Actions 自動化工作流程：

1. **版本發佈**: `pnpm update-version` 更新版本號
2. **建置打包**: 自動建置 Chrome 和 Firefox 版本
3. **上傳商店**: 自動上傳到擴展商店（需要配置 API 金鑰）

### 手動部署
```bash
# 1. 更新版本號
pnpm update-version

# 2. 建置並打包
pnpm zip

# 3. 上傳到 Chrome Web Store 或 Firefox Add-ons
```


### 程式碼規範
- 使用 TypeScript 嚴格模式
- 遵循 ESLint 和 Prettier 配置
- 提交前執行 `pnpm lint` 和 `pnpm type-check`
- 為新功能添加適當的測試


---

**由 [Eva813](https://github.com/Eva813) 開發維護**

> 💡 **提示**: 這個擴展程式旨在提升開發者和內容創作者的工作效率。如果你有任何改進建議或遇到問題，歡迎隨時聯繫我們！