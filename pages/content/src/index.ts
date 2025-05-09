import './messageHandler';
import { initializeSnippetManager } from '@src/snippet/snippetManager';
import { initializeCursorTracker } from '@src/cursor/cursorTracker';
import { initializeInputHandler } from '@src/input/inputHandler';

// 初始化應用程式
async function initialize() {
  await initializeSnippetManager();
  initializeCursorTracker();
  initializeInputHandler();
}

window.addEventListener('message', event => {
  // 驗證訊息來源和類型，確保訊息來自同一個來源
  if (event.origin !== window.location.origin) {
    return;
  }

  if (event.data && event.data.type === 'FROM_LOGIN_PAGE' && event.data.action === 'USER_LOGGED_IN') {
    console.log('內容腳本收到登入通知:', event.data);

    // 將訊息傳遞給背景腳本 (Background Script)
    chrome.runtime.sendMessage(
      {
        action: 'UPDATE_USER_STATUS_FROM_CLIENT',
        data: event.data.data, // 傳遞從網頁收到的資料
        domain: window.location.origin,
      },
      response => {
        if (chrome.runtime.lastError) {
          console.error('傳送訊息到背景腳本失敗:', chrome.runtime.lastError.message);
        } else {
          console.log('背景腳本回應:', response);
        }
      },
    );
  }

  if (event.data && event.data.type === 'FROM_SITE_HEADER' && event.data.action === 'USER_LOGGED_OUT') {
    console.log('內容腳本收到登出通知:', event.data);

    // 將登出訊息傳遞給背景腳本 (Background Script)
    chrome.runtime.sendMessage(
      {
        action: 'USER_LOGGED_OUT',
      },
      response => {
        if (chrome.runtime.lastError) {
          console.error('傳送登出訊息到背景腳本失敗:', chrome.runtime.lastError.message);
        } else {
          console.log('背景腳本回應:', response);
        }
      },
    );
  }
});
initialize();
