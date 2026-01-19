import './messageHandler';
import { getInitializationDelay, idleInitialize } from '@extension/shared/lib/utils/pageUtils';
import { initializePromptManager, clearPromptCache } from '@src/prompt/promptManager';
import { initializeCursorTracker } from '@src/cursor/cursorTracker';
import { initializeInputHandler, clearInputHandler } from '@src/input/inputHandler';
import { safetyManager } from '@src/utils/safetyManager';

// 無條件確認 content script 已載入（用於診斷和測試）
console.log('[Content Script] Loaded (v' + chrome.runtime.getManifest().version + ')');

const isDev = import.meta.env.MODE === 'development';

// 🔒 登出狀態標記
let isLoggingOut = false;
let logoutTimeoutId: ReturnType<typeof setTimeout> | null = null;

// 🔒 Extension context validation - prevent errors when extension is reloaded
let isContextValid = true;

function checkExtensionContext(): boolean {
  try {
    // chrome.runtime.id is undefined when context is invalidated
    if (!chrome.runtime?.id) {
      if (isContextValid) {
        isContextValid = false;
        console.warn('[Content Script] Extension context invalidated, cleaning up...');
        cleanupOnContextInvalidation();
      }
      return false;
    }
    return true;
  } catch {
    if (isContextValid) {
      isContextValid = false;
      console.warn('[Content Script] Extension context invalidated, cleaning up...');
      cleanupOnContextInvalidation();
    }
    return false;
  }
}

function cleanupOnContextInvalidation(): void {
  // Clear any pending timeouts
  if (logoutTimeoutId !== null) {
    clearTimeout(logoutTimeoutId);
    logoutTimeoutId = null;
  }
  // Clear input handlers
  clearInputHandler();
  clearPromptCache();
}

async function initialize() {
  try {
    // 初始化安全管理器，並檢查操作安全性
    if (!safetyManager.initialize()) {
      console.warn('[Content Script] 安全管理初始化失敗');
      return;
    }
    if (!safetyManager.isOperationSafe()) {
      console.warn('[Content Script] 系統狀態不安全，跳過初始化');
      return;
    }

    // 檢查使用者是否已登入
    const { userLoggedIn } = await chrome.storage.local.get('userLoggedIn');

    // 🆕 主動檢查 NextAuth session（比 DOM 偵測更可靠）
    if (!userLoggedIn) {
      if (isDev) console.log('[Content Script] Storage empty, checking NextAuth session...');

      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const session = await response.json();
          if (session && session.user) {
            if (isDev) console.log('[Content Script] Found active NextAuth session, setting storage');

            // 注意：不設定 apiDomain，讓它使用 config 中的預設值
            // 避免在非 PromptBear 網站上錯誤覆蓋 apiDomain
            await chrome.storage.local.set({
              userLoggedIn: true,
            });
          }
        }
      } catch (error) {
        if (isDev) console.log('[Content Script] Session check failed:', error);
      }
    }

    // 重新檢查儲存
    const { userLoggedIn: updatedUserLoggedIn } = await chrome.storage.local.get('userLoggedIn');

    // 只有在使用者已登入時才初始化相關功能
    if (updatedUserLoggedIn) {
      initializeInputHandler();
      initializeCursorTracker();
      await initializePromptManager();
      // 頁面 reload sendMessage，更新 icon 顏色
      chrome.runtime.sendMessage({ action: 'updateIcon' });

      if (isDev) {
        console.log('dev mode: [Content Script] 初始化完成');
      }
    } else {
      if (isDev) console.log('dev mode: [Content Script] User is not logged in, skipping initialization');
    }
  } catch (error) {
    console.error('[Content Script] 初始化失敗:', error);
  }
}

// 在安全時機使用共用的 idleInitialize
const delay = getInitializationDelay();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => idleInitialize(initialize, delay));
} else {
  idleInitialize(initialize, delay);
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
    // 🔒 立即標記登出狀態
    isLoggingOut = true;
    if (isDev) console.log('[Content Script] 收到網站登出通知，標記登出狀態');

    // 將登出訊息傳遞給背景腳本 (Background Script)
    chrome.runtime.sendMessage(
      {
        action: 'userLoggedOut',
      },
      () => {
        if (chrome.runtime.lastError) {
          if (isDev)
            console.error('Failed to send logout message to background script:', chrome.runtime.lastError.message);
        } else {
          if (isDev) console.log('Background script logout response received');
        }
      },
    );
  }
});

// 動態監聽 local storage 變化
chrome.storage.onChanged.addListener(async (changes, area) => {
  // 🔒 Check if extension context is still valid
  if (!checkExtensionContext()) {
    return;
  }

  // 用來檢查變更是否發生在本地儲存區（local storage）
  if (area === 'local') {
    if (changes.userLoggedIn?.newValue === false) {
      if (isDev) console.log('[Content Script] 使用者登出，清理快取');
      clearPromptCache();
      clearInputHandler();

      // 🔒 設置 fallback timeout - 2 秒後自動重置登出狀態
      // 以防網站無法發送 LOGOUT_COMPLETED 訊息
      if (logoutTimeoutId !== null) {
        clearTimeout(logoutTimeoutId);
      }
      logoutTimeoutId = setTimeout(() => {
        isLoggingOut = false;
        logoutTimeoutId = null;
        if (isDev) console.log('[Content Script] 登出超時，自動重置登出狀態');
      }, 2000);
    }
    // 使用者登入
    if (changes.userLoggedIn?.newValue === true) {
      if (isDev) console.log('[Content Script] 使用者登入，重新初始化');

      try {
        if (!checkExtensionContext()) return;
        initializeInputHandler();
        initializeCursorTracker();
        chrome.runtime.sendMessage({ action: 'updateIcon' });
        await initializePromptManager();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('Extension context invalidated')) {
          checkExtensionContext();
        } else {
          console.error('[Content Script] 重新初始化失敗:', error);
        }
      }
    }
  }
});

// 🆕 檢查 session 的共用函式
async function checkSession() {
  // 🔒 Check if extension context is still valid
  if (!checkExtensionContext()) {
    return;
  }

  // 🔒 如果正在登出，跳過 session 檢查
  if (isLoggingOut) {
    if (isDev) console.log('[Content Script] 登出中，跳過 session 檢查');
    return;
  }

  try {
    const { userLoggedIn } = await chrome.storage.local.get('userLoggedIn');

    // 如果儲存中沒有登入狀態，嘗試檢查 session
    if (!userLoggedIn) {
      if (isDev) console.log('[Content Script] 檢查 NextAuth session...');

      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const session = await response.json();
          if (session && session.user) {
            if (isDev) console.log('[Content Script] 偵測到登入狀態，更新儲存');

            await chrome.storage.local.set({
              userLoggedIn: true,
            });

            // 通知 Background 更新 icon
            try {
              chrome.runtime.sendMessage({ action: 'updateIcon' }, () => {
                if (chrome.runtime.lastError) {
                  if (isDev)
                    console.error('[Content Script] Failed to send updateIcon:', chrome.runtime.lastError.message);
                } else if (isDev) {
                  console.log('[Content Script] updateIcon sent successfully');
                }
              });
            } catch (error) {
              if (isDev) console.error('[Content Script] Failed to send updateIcon message:', error);
            }
          }
        }
      } catch (error) {
        if (isDev) console.log('[Content Script] 檢查 session 失敗:', error);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Extension context invalidated')) {
      checkExtensionContext();
    } else if (isDev) {
      console.error('[Content Script] checkSession error:', error);
    }
  }
}

// 🆕 監聯 tab 可見性變化（用戶從其他 tab 切換回來時檢查）
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (isDev) console.log('[Content Script] Tab 變為可見，檢查 session');
    checkSession();
  }
});

// 監聽來自 Background 的版本不符訊息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'versionMismatchLogout') {
    const { currentVersion, requiredVersion } = message.data;

    if (isDev) {
      console.log('[Content Script] Received version mismatch notification:', {
        currentVersion,
        requiredVersion,
      });
    }

    // 使用 postMessage 通知網頁登出
    // 這個訊息會被後台的 ExtensionListener.tsx 接收
    window.postMessage(
      {
        type: 'FROM_EXTENSION',
        action: 'VERSION_MISMATCH_LOGOUT',
        data: {
          currentVersion,
          requiredVersion,
        },
      },
      window.location.origin,
    );

    sendResponse({ success: true });
    return true; // 保持 sendResponse 通道開啟
  }

  // 🆕 處理 Extension 主動請求登出
  if (message.action === 'extensionRequestLogout') {
    const { reason } = message.data;

    // 🔒 立即標記登出狀態
    isLoggingOut = true;
    if (isDev) {
      console.log('[Content Script] Extension logout request received:', reason);
    }

    // 使用 postMessage 通知網頁執行登出
    // 這個訊息會被後台的 ExtensionListener.tsx 接收
    window.postMessage(
      {
        type: 'FROM_EXTENSION',
        action: 'REQUEST_LOGOUT',
        data: { reason },
      },
      window.location.origin,
    );

    sendResponse({ success: true });
    return true; // 保持 sendResponse 通道開啟
  }

  return false;
});

// 🆕 監聽來自網站的登出完成確認訊息
window.addEventListener('message', event => {
  // 驗證訊息來源
  if (event.origin !== window.location.origin) {
    return;
  }

  // 網站確認登出流程完成
  if (event.data && event.data.type === 'FROM_LOGIN_PAGE' && event.data.action === 'LOGOUT_COMPLETED') {
    if (isDev) {
      console.log('[Content Script] 收到網站登出完成確認，重置登出狀態');
    }

    // 🔒 立即重置登出標記，恢復正常監聽
    isLoggingOut = false;

    // 清除任何未完成的 timeout
    if (logoutTimeoutId !== null) {
      clearTimeout(logoutTimeoutId);
      logoutTimeoutId = null;
    }
  }
});
