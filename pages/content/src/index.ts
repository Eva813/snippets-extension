import './messageHandler';
import { initializeSnippetManager, clearSnippetCache } from '@src/snippet/snippetManager';
import { initializeCursorTracker } from '@src/cursor/cursorTracker';
import { initializeInputHandler, clearInputHandler } from '@src/input/inputHandler';

const isDev = import.meta.env.MODE !== 'production';
async function initialize() {
  // 檢查使用者是否已登入
  const { userLoggedIn } = await chrome.storage.local.get('userLoggedIn');

  // 只有在使用者已登入時才初始化相關功能
  if (userLoggedIn) {
    initializeInputHandler();
    initializeCursorTracker();
    await initializeSnippetManager();
    // 頁面 reload sendMessag，更新 icon 顏色
    chrome.runtime.sendMessage({ action: 'updateIcon' });
  } else {
    if (isDev) console.log('User is not logged in, skipping initialization');
  }
}

window.addEventListener('message', event => {
  // 驗證訊息來源和類型，確保訊息來自同一個來源
  if (event.origin !== window.location.origin) {
    return;
  }

  if (event.data && event.data.type === 'FROM_LOGIN_PAGE' && event.data.action === 'USER_LOGGED_IN') {
    // 將訊息傳遞給背景腳本 (Background Script)
    chrome.runtime.sendMessage(
      {
        action: 'updateUserStatusFromClient',
        data: event.data.data, // 傳遞從網頁收到的資料
        domain: window.location.origin,
      },
      response => {
        if (chrome.runtime.lastError) {
          if (isDev) console.error('Failed to send message to background script:', chrome.runtime.lastError.message);
        } else if (response.success) {
          // 登入後只更新 icon，輸入監聽和游標追蹤由 storage.onChanged 統一處理
          chrome.runtime.sendMessage({ action: 'updateIcon' });
        }
      },
    );
  }

  if (event.data && event.data.type === 'FROM_SITE_HEADER' && event.data.action === 'USER_LOGGED_OUT') {
    // 將登出訊息傳遞給背景腳本 (Background Script)
    chrome.runtime.sendMessage(
      {
        action: 'userLoggedOut',
      },
      response => {
        if (chrome.runtime.lastError) {
          if (isDev)
            console.error('Failed to send logout message to background script:', chrome.runtime.lastError.message);
        } else {
          if (isDev) console.log('Background script response:', response);
        }
      },
    );
  }
});

// 動態監聽 local storage 變化
chrome.storage.onChanged.addListener(async (changes, area) => {
  // 用來檢查變更是否發生在本地儲存區（local storage）
  if (area === 'local') {
    if (changes.userLoggedIn?.newValue === false) {
      clearSnippetCache();
      clearInputHandler();
    }
    // 使用者登入
    if (changes.userLoggedIn?.newValue === true) {
      initializeInputHandler();
      initializeCursorTracker();
      chrome.runtime.sendMessage({ action: 'updateIcon' });
      await initializeSnippetManager();
    }
  }
});

initialize();
