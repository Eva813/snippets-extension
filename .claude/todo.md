# Chrome Extension 版本檢查功能實作紀錄

## 專案資訊

- **功能名稱**: Chrome Extension 版本檢查與強制登出
- **實作日期**: 2025-11-27
- **計劃文件**: `.claude/plans/enumerated-beaming-cascade.md`
- **實作者**: Claude (Sonnet 4.5)

## 一、實作摘要

### 1.1 需求描述

當開發者部署新版 Chrome Extension 到 Chrome Web Store 時：
1. 用戶點擊 Extension icon 時觸發版本檢查
2. 如果用戶瀏覽器的 Extension 版本與後端配置的版本不一致
3. 強制登出後台用戶，要求重新登入
4. 確保所有用戶使用一致的 Extension 版本

### 1.2 核心原理

**版本比對策略**: 精確字串比對（Extension version === Backend required version）

- **不是** 最低版本檢查（version >= minVersion）
- **而是** 精確版本一致性檢查（version === requiredVersion）
- 只要版本不一致，無論新舊，都強制登出

### 1.3 技術架構

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│ Chrome Extension│         │  Next.js Backend │         │   用戶瀏覽器     │
└────────┬────────┘         └────────┬─────────┘         └────────┬────────┘
         │                           │                            │
         │ 1. 點擊 icon              │                            │
         │                           │                            │
         │ 2. GET /api/v1/extension/version-check                 │
         │    Header: x-extension-version: "1.0.1"                │
         │ ──────────────────────────>│                            │
         │                           │                            │
         │                           │ 3. Middleware 驗證 JWT    │
         │                           │    注入 x-user-id         │
         │                           │                            │
         │                           │ 4. 比對版本               │
         │                           │    (1.0.1 === EXTENSION_VERSION)
         │                           │                            │
         │ 5. 返回 versionMatched    │                            │
         │ <──────────────────────────│                            │
         │                           │                            │
         │ 6. 如果 versionMatched: false                          │
         │    發送 postMessage ──────────────────────────────────>│
         │                           │                            │
         │                           │    7. ExtensionListener   │
         │                           │       監聽訊息            │
         │                           │                            │
         │                           │    8. signOut()           │
         │                           │       跳轉 /login         │
         │                           │                            │
```

---

## 二、已實作的後端功能

### 2.1 新增的檔案清單

#### 檔案 1: `src/lib/versionUtils.ts`
**功能**: 版本檢查工具函式

```typescript
/**
 * 驗證版本格式是否符合 SemVer (x.y.z)
 */
export function validateVersionFormat(version: string): boolean

/**
 * 精確版本比對（字串相等）
 */
export function isVersionMatched(
  extensionVersion: string,
  requiredVersion: string
): boolean
```

#### 檔案 2: `src/shared/types/extension.ts`
**功能**: 型別定義

```typescript
export interface VersionCheckResponse {
  versionMatched: boolean;      // 版本是否一致
  extensionVersion: string;      // Extension 當前版本
  requiredVersion: string;       // 後端要求的版本
  updateUrl: string;             // Chrome Web Store 更新連結
  message?: string;              // 提示訊息
}

export interface ExtensionMessage {
  type: 'FROM_EXTENSION';
  action: 'VERSION_MISMATCH_LOGOUT';
  data?: {
    currentVersion: string;
    requiredVersion: string;
  };
}
```

#### 檔案 3: `src/components/ExtensionListener.tsx`
**功能**: Client Component，監聽 Extension 發來的 postMessage

```typescript
// 監聽來自 Extension 的版本不符訊息
// 執行 signOut() 並跳轉到登入頁
```

#### 檔案 4: `src/app/api/v1/extension/version-check/route.ts`
**功能**: 版本檢查 API endpoint（核心功能）

### 2.2 修改的檔案清單

1. **`src/app/layout.tsx`** - 加入 `<ExtensionListener />`
2. **`.env.example`** - 新增環境變數範例
3. **`.env.local`** - 新增開發環境配置

---

## 三、API 文檔

### 3.1 版本檢查 API

**Endpoint**: `GET /api/v1/extension/version-check`

**認證**: 需要（透過 Cookie 攜帶 NextAuth session）

**請求 Headers**:
```http
x-extension-version: 1.0.1
Cookie: next-auth.session-token=...
```

**回應格式** (200 OK):
```json
{
  "versionMatched": false,
  "extensionVersion": "1.0.1",
  "requiredVersion": "1.0.2",
  "updateUrl": "https://chromewebstore.google.com/detail/promptbear/afabpaicinkkgbajcjdgmocmdbajmjfm",
  "message": "Extension version mismatch. Please update to version 1.0.2."
}
```

**錯誤回應**:

| 狀態碼 | 錯誤代碼 | 說明 |
|--------|----------|------|
| 400 | `MISSING_VERSION_HEADER` | 缺少 `x-extension-version` header |
| 400 | `INVALID_VERSION_FORMAT` | 版本格式不正確（應為 x.y.z） |
| 401 | - | 未認證（缺少有效的 session） |
| 500 | - | 伺服器錯誤 |

**範例回應 (400 - 缺少 header)**:
```json
{
  "message": "Missing x-extension-version header",
  "error": "MISSING_VERSION_HEADER"
}
```

**範例回應 (400 - 格式錯誤)**:
```json
{
  "message": "Invalid version format. Expected x.y.z (SemVer)",
  "error": "INVALID_VERSION_FORMAT",
  "receivedVersion": "1.2"
}
```

### 3.2 環境變數配置

**檔案**: `.env.local` 或生產環境變數

```env
# Chrome Extension 版本控制
EXTENSION_VERSION=1.0.1
EXTENSION_UPDATE_URL=https://chromewebstore.google.com/detail/promptbear/afabpaicinkkgbajcjdgmocmdbajmjfm
```

**說明**:
- `EXTENSION_VERSION`: 當前部署的 Extension 版本（必須與 manifest.json 一致）
- `EXTENSION_UPDATE_URL`: Chrome Web Store 的 Extension 頁面連結

---

## 四、Chrome Extension 整合指南

### 4.1 Extension 端需要實作的功能

#### 步驟 1: 在 manifest.json 中聲明權限

```json
{
  "name": "PromptBear",
  "version": "1.0.1",
  "permissions": [
    "tabs",
    "notifications"
  ],
  "host_permissions": [
    "https://your-backend-domain.com/*"
  ]
}
```

#### 步驟 2: 實作版本檢查邏輯

**檔案**: `background.js` 或 `popup.js`

```javascript
// 當用戶點擊 Extension icon 時觸發
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // 1. 取得 Extension 版本
    const manifest = chrome.runtime.getManifest();
    const extensionVersion = manifest.version;

    console.log('[PromptBear] Extension version:', extensionVersion);

    // 2. 呼叫後端版本檢查 API
    const response = await fetch(
      'https://your-backend-domain.com/api/v1/extension/version-check',
      {
        method: 'GET',
        headers: {
          'x-extension-version': extensionVersion,
        },
        credentials: 'include', // 重要：攜帶 Cookie
      }
    );

    // 3. 處理回應
    if (!response.ok) {
      console.error('[PromptBear] Version check failed:', response.status);
      return;
    }

    const result = await response.json();
    console.log('[PromptBear] Version check result:', result);

    // 4. 檢查版本是否一致
    if (result.versionMatched === false) {
      // 4a. 通知後台網頁登出
      await notifyWebPageLogout(tab.id, result);

      // 4b. 顯示更新通知
      showUpdateNotification(result);

      // 4c. (可選) 觸發自動更新
      triggerExtensionUpdate();
    } else {
      // 版本一致，執行正常功能
      console.log('[PromptBear] Version matched. Proceeding...');
      // ... 你的正常 Extension 邏輯
    }
  } catch (error) {
    console.error('[PromptBear] Version check error:', error);
    // 降級處理：即使檢查失敗，也允許繼續使用
  }
});

// 4a. 通知後台網頁登出
async function notifyWebPageLogout(tabId, versionInfo) {
  try {
    // 方式 1: 使用 chrome.tabs.sendMessage (需要 content script)
    await chrome.tabs.sendMessage(tabId, {
      type: 'FROM_EXTENSION',
      action: 'VERSION_MISMATCH_LOGOUT',
      data: {
        currentVersion: versionInfo.extensionVersion,
        requiredVersion: versionInfo.requiredVersion,
      },
    });
  } catch (error) {
    console.error('[PromptBear] Failed to notify web page:', error);
  }
}

// 4b. 顯示更新通知
function showUpdateNotification(versionInfo) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: 'PromptBear Extension 需要更新',
    message: `目前版本 ${versionInfo.extensionVersion} 已過期，請更新至 ${versionInfo.requiredVersion} 並重新登入。`,
    buttons: [{ title: '立即更新' }],
    requireInteraction: true, // 需要用戶手動關閉
  });

  // 監聽按鈕點擊
  chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (buttonIndex === 0) {
      // 開啟 Chrome Web Store 更新頁面
      chrome.tabs.create({ url: versionInfo.updateUrl });
    }
  });
}

// 4c. 觸發自動更新
function triggerExtensionUpdate() {
  chrome.runtime.requestUpdateCheck((status, details) => {
    console.log('[PromptBear] Update check status:', status);

    if (status === 'update_available') {
      console.log('[PromptBear] Update available:', details.version);
      // Chrome 會在背景下載更新
      // 下次重啟瀏覽器或重新載入 Extension 時會自動安裝
    } else if (status === 'no_update') {
      console.log('[PromptBear] No update available. User needs to wait for Chrome Web Store approval.');
    }
  });
}
```

#### 步驟 3: 實作 Content Script (如果使用 sendMessage)

**檔案**: `content.js`

```javascript
// 監聽來自 background script 的訊息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (
    message.type === 'FROM_EXTENSION' &&
    message.action === 'VERSION_MISMATCH_LOGOUT'
  ) {
    console.log('[PromptBear Content Script] Received logout message:', message.data);

    // 轉發訊息給網頁（透過 window.postMessage）
    window.postMessage(message, window.location.origin);

    sendResponse({ success: true });
  }
});
```

**在 manifest.json 中註冊**:
```json
{
  "content_scripts": [
    {
      "matches": ["https://your-backend-domain.com/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

### 4.2 測試流程

#### 測試案例 1: 版本一致（正常情況）

1. Extension manifest.json: `"version": "1.0.1"`
2. 後端 .env.local: `EXTENSION_VERSION=1.0.1`
3. 點擊 Extension icon
4. **預期結果**: API 返回 `versionMatched: true`，正常執行功能

#### 測試案例 2: 版本不一致（需要登出）

1. Extension manifest.json: `"version": "1.0.1"`
2. 後端 .env.local: `EXTENSION_VERSION=1.0.2`
3. 點擊 Extension icon
4. **預期結果**:
   - API 返回 `versionMatched: false`
   - Extension 發送 postMessage
   - 後台自動登出並跳轉 `/login?reason=version_mismatch`
   - Extension 顯示更新通知

#### 測試案例 3: 未認證用戶

1. 用戶未登入後台
2. 點擊 Extension icon
3. **預期結果**: API 返回 401 Unauthorized

---

## 五、部署指南

### 5.1 後端部署步驟

**步驟 1**: 更新環境變數

```bash
# 生產環境 (.env.production 或平台環境變數)
EXTENSION_VERSION=1.0.2  # 與新版 Extension manifest.json 一致
EXTENSION_UPDATE_URL=https://chromewebstore.google.com/detail/promptbear/afabpaicinkkgbajcjdgmocmdbajmjfm
```

**步驟 2**: 部署後端代碼

```bash
npm run build
# 部署到 Vercel, Netlify, 或其他平台
```

**步驟 3**: 驗證 API

```bash
# 測試版本檢查 API
curl -X GET \
  -H "x-extension-version: 1.0.1" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  https://your-backend-domain.com/api/v1/extension/version-check
```

### 5.2 Extension 部署步驟

**步驟 1**: 更新 manifest.json 版本號

```json
{
  "version": "1.0.2"
}
```

**步驟 2**: 打包 Extension

```bash
# 建立 zip 檔案
zip -r extension.zip * -x "*.git*" "node_modules/*"
```

**步驟 3**: 上傳到 Chrome Web Store

1. 前往 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. 選擇 PromptBear Extension
3. 上傳新的 zip 檔案
4. 提交審核

**步驟 4**: 同步更新後端環境變數

⚠️ **重要**: Extension 審核通過後，立即更新後端的 `EXTENSION_VERSION`

```bash
# 更新後端環境變數
EXTENSION_VERSION=1.0.2  # 與新版 Extension 一致
```

### 5.3 版本管理最佳實踐

#### 方案 1: 保守策略（建議新手）

```bash
# 1. 先部署 Extension 到 Chrome Web Store
# 2. 等待審核通過（通常 1-3 天）
# 3. 確認用戶可以更新後
# 4. 才更新後端的 EXTENSION_VERSION

# 優點：不會提前強制用戶登出
# 缺點：有短暫的版本差異期
```

#### 方案 2: 積極策略

```bash
# 1. 先更新後端的 EXTENSION_VERSION
# 2. 立即部署 Extension 到 Chrome Web Store
# 3. Extension 審核通過後，用戶會自動更新

# 優點：版本嚴格一致
# 缺點：審核期間用戶可能被強制登出（需要等更新）
```

#### 方案 3: 寬容期策略（建議）

```bash
# 1. 部署新版 Extension (v1.0.2) 到 Chrome Web Store
# 2. 後端 EXTENSION_VERSION 保持舊版 (v1.0.1) 2-3 天
# 3. 2-3 天後（大部分用戶已更新）才改為 v1.0.2

# 優點：平衡使用者體驗和版本一致性
# 缺點：需要手動管理時間窗口
```

---

## 六、監控與維護

### 6.1 日誌監控

後端已在 API 中記錄版本檢查日誌：

```typescript
console.log('[Version Check]', {
  userId,
  extensionVersion,
  requiredVersion,
  versionMatched,
  timestamp: new Date().toISOString(),
});
```

**建議監控指標**:
- 版本不符的請求數量
- 各版本的用戶分佈
- 版本檢查 API 的錯誤率

### 6.2 告警設定

建議在以下情況設定告警：

1. **大量版本不符**: 如果 1 小時內超過 100 次 `versionMatched: false`
   - 可能原因：Extension 審核通過但後端未更新環境變數

2. **大量 400 錯誤**: 如果 1 小時內超過 50 次格式錯誤
   - 可能原因：Extension 發送了錯誤的版本格式

3. **API 錯誤率**: 如果 500 錯誤率超過 5%
   - 可能原因：後端環境變數未配置或代碼錯誤

---

## 七、常見問題 (FAQ)

### Q1: Extension 審核期間，後端應該何時更新版本號？

**A**: 建議採用「寬容期策略」：
- Extension 提交審核後，後端保持舊版本號
- 審核通過 2-3 天後（大部分用戶已自動更新），才更新後端版本號
- 這樣可以避免審核期間強制用戶登出

### Q2: 如果用戶瀏覽器禁用了自動更新怎麼辦？

**A**: Chrome Extension 預設會自動更新，但用戶可以：
- 手動前往 `chrome://extensions/` 點擊「更新」
- 點擊 Extension 的更新通知中的「立即更新」按鈕
- 重新安裝 Extension

### Q3: 版本檢查失敗（API 錯誤）會影響 Extension 正常使用嗎？

**A**: 不會。代碼中實作了降級處理：
```javascript
try {
  // 版本檢查邏輯
} catch (error) {
  console.error('Version check error:', error);
  // 降級處理：即使檢查失敗，也允許繼續使用
}
```

### Q4: 如何測試版本不符的情況？

**A**: 本地測試方法：
1. 在 Extension manifest.json 中設定 `"version": "1.0.1"`
2. 在後端 .env.local 中設定 `EXTENSION_VERSION=1.0.2`
3. 點擊 Extension icon，應該會觸發登出

### Q5: 用戶看到版本不符提示後，如何更新？

**A**: 更新流程：
1. Extension 會顯示通知：「請更新至 v1.0.2」
2. 點擊「立即更新」按鈕 → 開啟 Chrome Web Store
3. Chrome 會自動檢查並安裝更新
4. 重新載入 Extension 或重啟瀏覽器
5. 重新登入後台

---

## 八、未來擴展建議

### 8.1 版本統計儀表板

建議實作一個管理後台頁面，顯示：
- 各版本的用戶數量分佈
- 版本不符的趨勢圖
- 最近的版本檢查日誌

### 8.2 彈性版本策略

建議支援更靈活的版本策略：

```env
# 支援多個允許的版本（用逗號分隔）
EXTENSION_ALLOWED_VERSIONS=1.0.1,1.0.2
```

### 8.3 分階段推送

建議實作 A/B 測試式的版本推送：

```env
# 允許 10% 用戶使用新版本
EXTENSION_VERSION_BETA=1.0.2
EXTENSION_VERSION_BETA_RATIO=0.1
```

---

## 九、技術規格總結

| 項目 | 規格 |
|------|------|
| 後端框架 | Next.js 14 (App Router) |
| 認證方式 | NextAuth.js (Cookie-based) |
| 版本格式 | SemVer (x.y.z) |
| API Endpoint | `GET /api/v1/extension/version-check` |
| 通訊方式 | postMessage (Extension ↔ Web Page) |
| 版本比對邏輯 | 精確字串比對（===） |
| 錯誤處理 | 降級處理（允許繼續使用） |

---

## 十、相關文件連結

- **計劃文件**: `.claude/plans/enumerated-beaming-cascade.md`
- **Chrome Extension 整合文檔**: `docs/json-format-migration/chrome-extension-integration-guide.md`
- **Chrome Extension 更新規格**: `docs/chrome-extension-update-spec.md`

---

**文件版本**: 1.0
**最後更新**: 2025-11-27
**維護者**: PromptBear 開發團隊
