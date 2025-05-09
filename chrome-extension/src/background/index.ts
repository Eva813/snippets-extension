/* eslint-disable @typescript-eslint/no-explicit-any */
import 'webextension-polyfill';

// 定義類型
interface PopupData {
  title: string;
  content: any; // 建議使用更明確的類型而非 any
}

interface SnippetData {
  content: string;
  shortcut: string;
  name: string;
}

// 全域狀態（考慮改用更好的狀態管理方式）
let popupData: PopupData | null = null;
let targetTabId: number | null | undefined = null;
let hasFoldersGlobal = false;

// 建立獨立的資料夾取得函式，方便重複使用
async function fetchFolders() {
  try {
    console.log('開始執行 fetchFolders 函式');

    const { userLoggedIn, apiDomain } = await chrome.storage.local.get(['userLoggedIn', 'apiDomain']);
    if (!userLoggedIn) {
      console.log('使用者未登入，無法取得資料夾');
      return { success: false, error: 'User not logged in' };
    }

    // 使用儲存的網域或默認值
    const baseUrl = apiDomain || 'http://localhost:3000';
    // 使用 credentials: 'include' 確保 cookie 被發送
    const resp = await fetch(`${baseUrl}/api/v1/folders`, {
      method: 'GET',
      headers: { 'x-vercel-protection-bypass': import.meta.env.VITE_VERCEL_PREVIEW_BYPASS },
      credentials: 'include', // 關鍵設定：包含 cookie
      mode: 'cors', // 確保跨域請求可以正常工作
    });

    if (!resp.ok) {
      // 嘗試讀取錯誤訊息
      let errorBody = '';
      try {
        errorBody = await resp.text();
        console.error('error:', errorBody);
      } catch (textError) {
        console.error('error:', textError);
      }

      throw new Error(`getFolders error，status: ${resp.status}, message: ${errorBody || 'unknown error'}`);
    }

    const data = await resp.json();
    hasFoldersGlobal = Array.isArray(data) && data.length > 0;

    // 儲存資料夾資訊到 storage
    await chrome.storage.local.set({ folders: data, hasFolders: hasFoldersGlobal });

    return {
      success: true,
      hasFolders: hasFoldersGlobal,
      folders: data,
    };
  } catch (error) {
    const errorMessage = (error as Error).message || 'unknown error';
    hasFoldersGlobal = false;
    await chrome.storage.local.set({ hasFolders: false });
    return {
      success: false,
      hasFolders: false,
      error: `getFolders error: ${errorMessage}`,
    };
  }
}

function setupExtensionControls() {
  // 監聽 extension icon 點擊事件
  chrome.action.onClicked.addListener(async tab => {
    console.log('點擊擴充功能圖示，開始重新取得資料夾資訊');
    // 先檢查使用者是否登入
    const { userLoggedIn } = await chrome.storage.local.get('userLoggedIn');
    if (!userLoggedIn) {
      chrome.tabs.create({ url: 'http://localhost:3000/login' });
      return;
    }

    if (tab.id !== undefined) {
      chrome.tabs.sendMessage(tab.id, { action: 'toggleSlidePanel' });
    } else {
      // 雖然已登入但沒有資料夾，可能需要建立資料夾
      chrome.tabs.create({ url: 'http://localhost:3000/login' });
    }
  });

  // 監聽快捷鍵事件
  chrome.commands.onCommand.addListener(async command => {
    if (command === 'toggle_side_panel') {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id !== undefined) {
        chrome.tabs.sendMessage(tab.id, { action: 'toggleSlidePanel' });
      }
    }
  });

  // 處理開啟快捷鍵設定頁面
  chrome.runtime.onMessage.addListener(message => {
    if (message.action === 'openShortcutsPage') {
      chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    }
  });
}

// Popup 視窗相關處理
function setupPopupHandling() {
  chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    // 建立 popup 視窗
    if (message.action === 'createWindow') {
      handleCreatePopupWindow(message, sendResponse);
      return true;
    }

    // Popup 請求資料
    if (message.action === 'getPopupData') {
      sendResponse({ data: popupData });
      return true;
    }

    // Popup 表單提交
    if (message.action === 'submitForm') {
      handleFormSubmission(message, sendResponse);
      return true;
    }

    return false;
  });
}

// 側邊欄相關處理
function setupSidePanelHandling() {
  chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === 'sidePanelInsertPrompt') {
      handleSidePanelInsert(message, sendResponse);
      return true;
    }
    return false;
  });
}

// PopupWindow
function handleCreatePopupWindow(message: any, sendResponse: (response?: any) => void) {
  popupData = {
    title: message.title,
    content: message.content,
  };

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs?.[0]?.id) {
      targetTabId = tabs[0].id;
    }

    chrome.windows.create(
      {
        url: chrome.runtime.getURL('side-panel/formLoader.html'),
        type: 'popup',
        width: 500,
        height: 400,
      },
      () => {
        sendResponse({ success: true });
      },
    );
  });
}

function handleFormSubmission(message: any, sendResponse: (response?: any) => void) {
  if (!targetTabId) {
    console.error('No target tab id stored');
    sendResponse({ success: false, error: 'No target tab id stored' });
    return;
  }

  chrome.tabs.sendMessage(targetTabId, { action: 'insertPrompt', prompt: message.finalOutput }, response => {
    if (chrome.runtime.lastError) {
      console.error('Message send error:', chrome.runtime.lastError);
      sendResponse({ success: false, error: chrome.runtime.lastError.message });
      return;
    }
    sendResponse({ success: true, response });
  });
}

function handleSidePanelInsert(message: any, sendResponse: (response?: any) => void) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs || !tabs[0]?.id) {
      sendResponse({ success: false, error: 'No active tab found.' });
      return;
    }

    const { content, shortcut, name } = message.snippet as SnippetData;
    const title = `${shortcut} - ${name}`;

    chrome.tabs.sendMessage(tabs[0].id, { action: 'insertPrompt', prompt: content, title }, response => {
      sendResponse({ success: true, response });
    });
  });
}

// 統一處理所有訊息，避免多重註冊與通道提前關閉
chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
  // 使用立即呼叫的 async 函式處理非同步邏輯，並確保同步返回 true 以保留通道
  (async () => {
    try {
      switch (message.type || message.action) {
        case 'createWindow':
          handleCreatePopupWindow(message, sendResponse);
          break;
        case 'getPopupData':
          sendResponse({ data: popupData });
          break;
        case 'submitForm':
          handleFormSubmission(message, sendResponse);
          break;
        case 'sidePanelInsertPrompt':
          handleSidePanelInsert(message, sendResponse);
          break;
        case 'openShortcutsPage':
          chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
          sendResponse({ success: true });
          break;
        case 'GET_FOLDERS': {
          try {
            const { userLoggedIn } = await chrome.storage.local.get('userLoggedIn');
            if (!userLoggedIn) {
              console.log('使用者未登入，無法獲取資料夾');
              sendResponse({ success: false, error: '使用者未登入' });
              break;
            }

            console.log('處理 GET_FOLDERS 請求，呼叫 fetchFolders');
            const result = await fetchFolders();
            console.log('fetchFolders 結果:', result);

            if (result.success && result.folders) {
              sendResponse({
                success: true,
                data: result.folders,
              });
            } else {
              sendResponse({
                success: false,
                error: result.error || 'unknown error',
              });
            }
          } catch (error) {
            const errorMessage = (error as Error).message || 'unknown error';
            sendResponse({ success: false, error: errorMessage });
          }
          break;
        }
        case 'updateIcon':
          hasFoldersGlobal = message.hasFolders;
          chrome.action.setIcon({ path: hasFoldersGlobal ? 'icon-34.png' : 'icon-34-gray.png' });
          sendResponse({ success: true });
          break;
        case 'UPDATE_USER_STATUS_FROM_CLIENT':
          chrome.action.setIcon({ path: 'icon-34.png' }, () => {
            if (chrome.runtime.lastError) {
              console.error('renew error:', chrome.runtime.lastError);
            } else {
              console.log('renew icon-34.png');
            }
          });
          // 儲存使用者狀態 (但不儲存權杖，因為會使用 cookie)
          chrome.storage.local.set(
            { userLoggedIn: message.data.status === 'loggedIn', apiDomain: message.domain },
            async () => {
              if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
              } else {
                console.log('使用者登入狀態已儲存為 true');

                // 登入後立即嘗試獲取資料夾，以確認授權有效
                if (message.data.status === 'loggedIn') await fetchFolders();
                sendResponse({ success: true, message: '使用者狀態已更新' });
              }
            },
          );

          break;
        case 'FROM_LOGIN_PAGE':
          // 先直接更新圖示，不等待儲存操作
          chrome.action.setIcon({ path: 'icon-34.png' }, () => {
            if (chrome.runtime.lastError) {
              console.error('failed to update icon:', chrome.runtime.lastError);
            } else {
              console.log('renew icon-34.png');
            }
          });

          // 然後更新儲存狀態
          chrome.storage.local.set({ userLoggedIn: true }, () => {
            if (chrome.runtime.lastError) {
              console.error('failed to update user status:', chrome.runtime.lastError);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              console.log('user status updated to true');
              sendResponse({ success: true });
            }
          });

          break;
        case 'USER_LOGGED_OUT':
          console.log('Received logout notification, clearing data');
          chrome.action.setIcon({ path: 'icon-34-gray.png' }, () => {
            if (chrome.runtime.lastError) {
              console.error('failed to update icon:', chrome.runtime.lastError);
            } else {
              console.log('renew icon-34-gray.png');
            }
          });

          // 清除 chrome.storage.local 的資料
          chrome.storage.local.clear(() => {
            if (chrome.runtime.lastError) {
              console.error('failed to clear data:', chrome.runtime.lastError);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              console.log('chrome.storage.local data cleared');
              sendResponse({ success: true });
            }
          });

          break;
        default:
          // 未處理動作
          break;
      }
    } catch (err: any) {
      sendResponse({ success: false, error: err.message });
    }
  })();
  return true;
});
// 初始化
async function initialize() {
  const { userLoggedIn } = await chrome.storage.local.get('userLoggedIn');
  console.log('初始化時使用者登入狀態:', userLoggedIn);

  const iconPath = userLoggedIn ? 'icon-34.png' : 'icon-34-gray.png';
  chrome.action.setIcon({ path: iconPath }, () => {
    if (chrome.runtime.lastError) {
      console.error('failed to initialize icon:', chrome.runtime.lastError);
    } else {
      console.log('initialized icon as:', iconPath);
    }
  });

  setupExtensionControls();
  setupPopupHandling();
  setupSidePanelHandling();
}

initialize();
