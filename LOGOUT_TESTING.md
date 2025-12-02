# Chrome Extension 登出流程測試指南

## 🎯 實作概述

已完成 CSRF Token 相容的登出流程修復，採用「通知型登出」架構：

```
Extension → Content Script → postMessage → Next.js ExtensionListener → signOut()
```

## ✅ 完成的修改

### 1. 訊息類型定義
- **檔案**: `chrome-extension/src/background/types/messages.ts`
- **變更**: 新增 `requestLogout` action 和 `RequestLogoutMessage` 類型

### 2. AuthFeature 登出方法
- **檔案**: `chrome-extension/src/background/features/auth/authFeature.ts`
- **變更**: 新增 `requestLogout()` 方法
- **功能**: 
  - 向所有後台 tabs 廣播登出請求
  - 清除 Extension storage
  - 更新 icon 狀態

### 3. Content Script 訊息轉發
- **檔案**: `pages/content/src/index.ts`
- **變更**: 新增 `extensionRequestLogout` 監聽器
- **功能**: 將登出請求轉發至前端（透過 postMessage）

### 4. MessageRouter 註冊
- **檔案**: `chrome-extension/src/background/index.ts`
- **變更**: 註冊 `requestLogout` handler

---

## 🧪 測試方法

### **測試 1: Chrome DevTools 手動測試**

1. 開啟任何後台網站頁面
2. 打開 Chrome DevTools Console
3. 執行以下程式碼：

```javascript
// 測試 requestLogout 訊息
chrome.runtime.sendMessage({
  action: 'requestLogout',
  reason: 'manual_test'
}, (response) => {
  console.log('Response:', response);
});
```

**預期結果**：
- ✅ Console 顯示 `[Content Script] Extension logout request: manual_test`
- ✅ 前端 ExtensionListener 接收到 `REQUEST_LOGOUT` 訊息
- ✅ NextAuth `signOut()` 被觸發
- ✅ Session cookie 被清除
- ✅ 重定向至 `/login?reason=manual_test`
- ✅ Extension icon 變為灰色

---

### **測試 2: 檢查 Network 流量**

1. 打開 Chrome DevTools → Network tab
2. 篩選 `/api/auth/signout`
3. 執行測試 1 的程式碼
4. 查看請求詳情

**預期結果**：
- ✅ 請求包含 `X-CSRF-Token` header
- ✅ 回應狀態 200 OK
- ✅ `Set-Cookie` header 清除 session cookie

---

### **測試 3: 多 Tab 同步測試**

1. 開啟 3 個後台網站 tabs
2. 在其中一個 tab 的 Console 執行：

```javascript
chrome.runtime.sendMessage({
  action: 'requestLogout',
  reason: 'multi_tab_test'
});
```

**預期結果**：
- ✅ 所有 3 個 tabs 同時收到登出訊息
- ✅ 所有 tabs 都重定向至 `/login`
- ✅ Extension storage 被清除

---

### **測試 4: Extension Storage 檢查**

1. 執行登出操作
2. 打開 Chrome → 擴充功能 → snippets-extension → 檢查背景頁面
3. 在 Console 執行：

```javascript
chrome.storage.local.get(null, (data) => {
  console.log('Storage:', data);
});
```

**預期結果**：
- ✅ Storage 為空物件 `{}`
- ✅ `userLoggedIn` 不存在
- ✅ `apiDomain` 不存在

---

### **測試 5: Icon 狀態檢查**

1. 登出前：Extension icon 為彩色
2. 執行登出
3. 檢查 Extension icon

**預期結果**：
- ✅ Icon 變為灰色 (`icon-34-gray.png`)

---

## 🔄 完整流程驗證

執行以下完整流程測試：

1. **登入** → 確認 icon 為彩色
2. **觸發登出** → 執行 `requestLogout` 訊息
3. **檢查 Content Script** → Console 顯示登出訊息
4. **檢查前端** → ExtensionListener 接收到訊息
5. **檢查 Network** → signOut API 呼叫成功
6. **檢查重定向** → 導向 `/login`
7. **檢查 Storage** → Extension storage 已清除
8. **檢查 Icon** → 變為灰色

---

## 🐛 常見問題排查

### 問題 1: Content Script 沒有收到訊息

**檢查**：
```javascript
// 在 Background Console 執行
chrome.tabs.query({}, (tabs) => {
  console.log('Active tabs:', tabs.filter(t => t.url?.startsWith('http')));
});
```

**解決**：確保 tab URL 符合 `https://` 或 `http://` 格式

---

### 問題 2: 前端 ExtensionListener 沒有觸發

**檢查**：
- 確認 Next.js 專案已實作 ExtensionListener.tsx
- 檢查 `window.addEventListener('message')` 是否正確監聽
- 驗證訊息 origin 是否符合

**測試**：
```javascript
// 在前端 Console 手動測試
window.postMessage({
  type: 'FROM_EXTENSION',
  action: 'REQUEST_LOGOUT',
  data: { reason: 'test' }
}, window.location.origin);
```

---

### 問題 3: CSRF Token 錯誤

**檢查**：
- 確認前端使用 `signOut()` 而非直接 fetch API
- 檢查 NextAuth 配置是否正確

**解決**：NextAuth 的 `signOut()` 會自動處理 CSRF token

---

## 📝 後續整合步驟

### 在實際 Extension UI 中使用

當你需要在 Extension 的 Popup 或其他 UI 中新增登出按鈕時：

```typescript
// pages/popup/src/components/LogoutButton.tsx
async function handleLogout() {
  try {
    // 發送登出請求至 Background Script
    const response = await chrome.runtime.sendMessage({
      action: 'requestLogout',
      reason: 'user_manual_logout'
    });
    
    if (response.success) {
      console.log('Logout initiated successfully');
      // 可選：關閉 popup
      window.close();
    }
  } catch (error) {
    console.error('Logout failed:', error);
  }
}
```

---

## ✨ 優勢總結

1. **✅ CSRF Token 自動處理** - 由 NextAuth 完全管理
2. **✅ 架構清晰** - 責任分離明確
3. **✅ 多 Tab 支援** - 自動廣播至所有 tabs
4. **✅ 類型安全** - 完整 TypeScript 覆蓋
5. **✅ 易於維護** - 複用現有版本檢查流程模式
6. **✅ 向後相容** - 不影響現有功能

---

## 🚀 部署檢查清單

- [ ] 所有測試通過
- [ ] Network 確認 CSRF token 存在
- [ ] 多 Tab 同步正常
- [ ] Extension storage 正確清除
- [ ] Icon 狀態正確更新
- [ ] 前端 ExtensionListener 正常運作
- [ ] 生產環境測試

---

**實作日期**: 2025年12月1日  
**架構模式**: 通知型登出流程（Extension as Notifier）
