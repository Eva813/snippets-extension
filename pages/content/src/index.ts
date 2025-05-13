import './messageHandler';
import { initializeSnippetManager } from '@src/snippet/snippetManager';
import { initializeCursorTracker } from '@src/cursor/cursorTracker';
import { initializeInputHandler } from '@src/input/inputHandler';

async function initialize() {
  // 檢查使用者是否已登入
  const { userLoggedIn } = await chrome.storage.local.get('userLoggedIn');
  console.log('使用者登入狀態:', userLoggedIn);

  // 只有在使用者已登入時才初始化相關功能
  if (userLoggedIn) {
    await initializeSnippetManager();
    initializeInputHandler();
    initializeCursorTracker();
  } else {
    console.log('User is not logged in, skipping initialization');
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
        action: 'UPDATE_USER_STATUS_FROM_CLIENT',
        data: event.data.data, // 傳遞從網頁收到的資料
        domain: window.location.origin,
      },
      response => {
        if (chrome.runtime.lastError) {
          console.error('Failed to send message to background script:', chrome.runtime.lastError.message);
        } else {
          console.log('Background script response:', response);
        }
      },
    );
  }

  if (event.data && event.data.type === 'FROM_SITE_HEADER' && event.data.action === 'USER_LOGGED_OUT') {
    // 將登出訊息傳遞給背景腳本 (Background Script)
    chrome.runtime.sendMessage(
      {
        action: 'USER_LOGGED_OUT',
      },
      response => {
        if (chrome.runtime.lastError) {
          console.error('Failed to send logout message to background script:', chrome.runtime.lastError.message);
        } else {
          console.log('Background script response:', response);
        }
      },
    );
  }
});
initialize();
