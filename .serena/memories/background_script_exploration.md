# Chrome Extension Background Script 探索結果

## 1. Background Script 位置和結構

### 主入口點
- **位置**: `/Users/black-star-point-frontend/snippets-extension/chrome-extension/src/background/index.ts`
- **作用**: Extension 的主啟動檔案，Service Worker 的進入點

### 核心檔案結構
```
chrome-extension/src/background/
├── index.ts                          # 主入口點
├── core/
│   ├── messageRouter.ts             # 訊息路由器
│   ├── eventManager.ts              # 事件管理
│   └── stateManager.ts              # 狀態管理
├── features/                         # 功能層
│   ├── auth/authFeature.ts          # 認證功能
│   ├── ui/uiFeature.ts              # UI 功能
│   ├── prompts/promptFeature.ts     # Prompt 功能
│   ├── folders/folderFeature.ts     # 資料夾功能
│   └── spaces/spaceFeature.ts       # Space 功能
├── services/                         # 服務層
│   ├── storageService.ts            # 存儲服務
│   ├── cacheService.ts              # 緩存服務
│   └── notificationService.ts       # 通知服務
├── utils/                            # 工具層
├── config/                           # 設定層
└── types/                            # 類型定義
```

## 2. Icon 點擊事件的處理邏輯

### EventManager 實現 (`eventManager.ts`)
```typescript
export class EventManager {
  setupExtensionControls(): void {
    // 監聽 extension icon 點擊事件
    chrome.action.onClicked.addListener(async tab => {
      const { userLoggedIn } = await chrome.storage.local.get('userLoggedIn');
      if (!userLoggedIn) {
        await openLoginPage();
        return;
      }
      if (tab.id !== undefined) {
        chrome.tabs.sendMessage(tab.id, { action: 'toggleSlidePanel' });
      } else {
        await openLoginPage();
      }
    });
  }
  
  setupContextMenu(): void {
    // 創建右鍵選單
    chrome.contextMenus.create({
      id: 'addToPromptBear',
      title: 'Add to PromptBear',
      contexts: ['selection'],
    });
  }
}
```

**觸發邏輯：**
- `chrome.action.onClicked.addListener()` - 監聽 icon 點擊
- 檢查 `userLoggedIn` 狀態
- 若已登入：發送 `toggleSlidePanel` 訊息到 content script
- 若未登入：打開登入頁面

### 初始化流程
在 `index.ts` 中調用：
```typescript
async function initialize(): Promise<void> {
  await AuthFeature.initializeIcon();     // 初始化圖示
  registerMessageHandlers();              // 註冊訊息處理器
  messageRouter.setupMessageListener();   // 設置訊息監聽
  eventManager.init();                    // 初始化事件管理
  eventManager.setupContextMenuHandler(handleContextMenuClick);
}

initialize();  // 啟動應用程式
```

## 3. 現有的初始化流程和 Service Worker 設定

### manifest.json 配置
```json
{
  "manifest_version": 3,
  "version": "1.2.5",
  "background": {
    "service_worker": "background.iife.js",
    "type": "module"
  },
  "action": {
    "default_icon": "icon-34.png"
  },
  "commands": {
    "toggle_side_panel": {
      "suggested_key": {
        "default": "Alt+E",
        "mac": "Alt+E"
      },
      "description": "Toggle the side panel."
    }
  }
}
```

### Service Worker 生命週期事件
- **未實現 `onInstalled`** - 沒有安裝事件監聽
- **未實現 `onUpdated`** - 沒有更新事件監聽
- **未實現 `onStartup`** - 沒有啟動事件監聽

### 現有的事件監聽
1. `chrome.action.onClicked` - Icon 點擊事件
2. `chrome.commands.onCommand` - 快捷鍵事件 (Alt+E)
3. `chrome.contextMenus.onClicked` - 右鍵選單事件
4. `chrome.runtime.onMessage` - 訊息事件

## 4. 版本相關程式碼

### 當前版本信息
- **package.json 版本**: 1.3.1
- **manifest.json 版本**: 1.2.5 (不同步！)
- **位置**: 
  - package.json: `/Users/black-star-point-frontend/snippets-extension/package.json`
  - manifest.json: `/Users/black-star-point-frontend/snippets-extension/manifest.json`

### 版本更新工具
- **更新腳本**: `update_version.sh`
  - 使用方式: `pnpm update-version <new_version>`
  - 格式: `<0.0.0>`
- **說明文件**: `UPDATE-PACKAGE-VERSIONS.md`

### 已實現的版本檢查功能（在編譯後的代碼中）
在編譯後的 `dist/background.iife.js` 中發現了版本檢查邏輯：
- 函數 `O(apiDomain, extensionVersion)` - 檢查版本兼容性
- 後端 API: `{apiDomain}/api/v1/extension/version-check`
- 版本檢查時機：在 icon 點擊時執行
- 檢查項目：
  - `compatible` - 是否兼容
  - `forceUpdate` - 是否強制更新
  - `requiredVersion` - 需要的版本
  - `currentVersion` - 當前版本

### 版本檢查流程（來自編譯代碼）
```typescript
// 在 icon 點擊時
const manifest = chrome.runtime.getManifest();
const version = manifest.version;
const versionCheck = await checkVersionCompatibility(apiDomain, version);

if (versionCheck && !versionCheck.compatible && versionCheck.forceUpdate) {
  // 清除認證狀態
  await StorageService.clear();
  await chrome.action.setIcon({ path: 'icon-34-gray.png' });
  // 顯示警告並打開登入頁面
}
```

## 5. 關鍵的開發注意事項

### 消息處理器註冊（在 index.ts）
已註冊的訊息類型：
- UI: createWindow, getPopupData, submitForm, openShortcutsPage
- Prompt: getPromptByShortcut, sidePanelInsertPrompt
- Folder: getFolders, getSpaceFolders, getSharedFolders, ...
- Space: getPromptSpaces, setDefaultSpace, ...
- Auth: updateUserStatusFromClient, userLoggedOut, updateIcon

### Storage 服務 (StorageService)
使用 Chrome storage.local API：
- 用戶登入狀態: `userLoggedIn`
- API 域名: `apiDomain`
- 用戶 ID: `userId`
- Prompts 緩存: `prompts`
- Folders 緩存: `folders`
- 版本相關: `versionIncompatible`, `versionWarningMessage`

### Logger 實現
- 位置: `packages/shared/lib/logging/logger.ts`
- 功能：根據環境自動檢測開發/生產模式
- 開發模式檢測方式：
  - 檢查 `process.env.NODE_ENV`
  - 檢查 Chrome Extension manifest 是否有 `update_url`
  - 檢查 hostname 是否為 localhost

## 6. 尚未實現的功能

根據現有代碼分析，以下功能未實現：
1. ❌ `chrome.runtime.onInstalled` - 安裝時初始化
2. ❌ `chrome.runtime.onUpdated` - 更新時處理
3. ❌ `chrome.runtime.onStartup` - 啟動時初始化
4. ⚠️ 版本檢查功能在 TypeScript 源碼中找不到（只在編譯後的代碼中存在）
5. ⚠️ manifest.json 版本 (1.2.5) 與 package.json 版本 (1.3.1) 不同步

## 7. 典型的事件流程圖

```
Extension Install/Start
    ↓
initialize() 函數執行
    ├─→ AuthFeature.initializeIcon()      # 設置圖示顏色
    ├─→ registerMessageHandlers()         # 註冊訊息處理器
    ├─→ messageRouter.setupMessageListener()
    └─→ eventManager.init()
            ├─→ setupExtensionControls()  # 監聽 icon 點擊
            └─→ setupContextMenu()        # 創建右鍵選單

User Interaction
├─→ Click Extension Icon
│   ├─→ chrome.action.onClicked 觸發
│   ├─→ 檢查 userLoggedIn 狀態
│   ├─→ [可能] 執行版本檢查
│   └─→ 發送 toggleSlidePanel 訊息到 content script
│
├─→ Press Alt+E
│   ├─→ chrome.commands.onCommand 觸發
│   └─→ 發送 toggleSlidePanel 訊息到 content script
│
└─→ Right-Click & Select "Add to PromptBear"
    ├─→ chrome.contextMenus.onClicked 觸發
    └─→ PromptFeature.addToPromptBearFromContextMenu()
```
