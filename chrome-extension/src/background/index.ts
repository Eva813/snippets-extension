/* eslint-disable @typescript-eslint/no-explicit-any */
import 'webextension-polyfill';
import { fetchFolders } from './utils/fetchFolders';
import { fetchPromptSpaces } from './utils/fetchPromptSpaces';
import { fetchSpaceFolders, type FolderData } from './utils/fetchSpaceFolders';
import { getDefaultSpaceIdFromApiData, getDefaultSpaceIdFromCache } from './utils/getDefaultSpaceId';

// 定義類型
interface PopupData {
  title: string;
  content: string | Record<string, unknown>;
}

interface PromptData {
  content: string;
  shortcut: string;
  name: string;
}

type RuntimeMessage =
  | { action: 'createWindow'; title: string; content: string }
  | { action: 'getPopupData' }
  | { action: 'submitForm'; finalOutput: string }
  | { action: 'sidePanelInsertPrompt'; prompt: PromptData }
  | { action: 'openShortcutsPage' }
  | { action: 'getFolders' }
  | { action: 'getPromptSpaces' }
  | { action: 'getSpaceFolders'; promptSpaceId: string }
  | { action: 'updateIcon'; hasFolders: boolean }
  | { action: 'updateUserStatusFromClient'; data: { status: 'loggedIn' | 'loggedOut' }; domain: string }
  | { action: 'userLoggedOut' }
  | { action: 'getPromptByShortcut'; shortcut: string }
  | { action: 'addToPromptBear'; selectedText: string; pageUrl?: string; pageTitle?: string };

// 全域狀態
let popupData: PopupData | null = null;
let targetTabId: number | null | undefined = null;
const DEFAULT_API_DOMAIN = 'https://linxly-nextjs.vercel.app';

function setupExtensionControls() {
  // 監聽 extension icon 點擊事件
  chrome.action.onClicked.addListener(async tab => {
    const { userLoggedIn } = await chrome.storage.local.get('userLoggedIn');
    if (!userLoggedIn) {
      chrome.tabs.create({ url: `${DEFAULT_API_DOMAIN}/login` });
      return;
    }

    if (tab.id !== undefined) {
      chrome.tabs.sendMessage(tab.id, { action: 'toggleSlidePanel' });
    } else {
      chrome.tabs.create({ url: `${DEFAULT_API_DOMAIN}/login` });
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
}

// 智能選擇目標 Space 和 Folder
interface SmartDestination {
  targetSpaceId: string | null;
  targetFolderId: string | null;
}

async function getSmartDestination(): Promise<SmartDestination> {
  try {
    // 1. 直接調用 API 獲取最新的 Spaces 資料
    const spacesResult = await fetchPromptSpaces();
    if (!spacesResult.success || !spacesResult.data) {
      console.warn('Failed to fetch prompt spaces:', spacesResult.error);
      return { targetSpaceId: null, targetFolderId: null };
    }

    // 2. 從 API 資料中選擇預設 Space ID
    const targetSpaceId = getDefaultSpaceIdFromApiData(spacesResult.data);
    if (!targetSpaceId) {
      console.warn('No default space found in API data');
      return { targetSpaceId: null, targetFolderId: null };
    }

    console.log('Selected default space ID:', targetSpaceId);

    // 3. 獲取該 Space 的資料夾列表
    const foldersResult = await fetchSpaceFolders(targetSpaceId);
    if (!foldersResult.success || !foldersResult.data || foldersResult.data.length === 0) {
      console.warn('No folders found in space:', targetSpaceId);
      return { targetSpaceId, targetFolderId: null };
    }

    // 4. 選擇第一個資料夾
    const firstFolder = foldersResult.data[0];
    console.log('Selected target folder:', firstFolder.name, firstFolder.id);

    return {
      targetSpaceId,
      targetFolderId: firstFolder.id,
    };
  } catch (error) {
    console.error('Error in getSmartDestination:', error);
    return { targetSpaceId: null, targetFolderId: null };
  }
}

// 創建 Context Menu（Chrome 會自動使用 manifest 中的 16px icon）
chrome.contextMenus.create({
  id: 'addToPromptBear',
  title: 'Add to PromptBear',
  contexts: ['selection'],
});

// Context Menu 點擊處理
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'addToPromptBear') {
    const selectedText = info.selectionText || '';
    const pageUrl = tab?.url || '';
    const pageTitle = tab?.title || '';

    console.log('=== Add to PromptBear ===');
    console.log('Selected text:', selectedText);
    console.log('Page URL:', pageUrl);
    console.log('Page title:', pageTitle);

    try {
      // 獲取 API domain 和登入狀態
      const { userLoggedIn, apiDomain } = await chrome.storage.local.get(['userLoggedIn', 'apiDomain']);

      if (!userLoggedIn) {
        console.warn('User not logged in, cannot add to PromptBear');
        return;
      }

      const DEFAULT_API_DOMAIN = 'http://localhost:3000';
      const baseUrl = apiDomain || DEFAULT_API_DOMAIN;

      // 編碼選取的文字
      const encodedContent = encodeURIComponent(selectedText);
      const encodedPageUrl = encodeURIComponent(pageUrl);
      const encodedPageTitle = encodeURIComponent(pageTitle);

      // 智能選擇目標 Space 和 Folder
      const { targetSpaceId, targetFolderId } = await getSmartDestination();

      // 構建跳轉 URL（符合後台實際架構）
      let targetUrl: string;
      if (targetFolderId) {
        // 跳轉到具體的資料夾頁面
        targetUrl = `${baseUrl}/prompts/folder/${targetFolderId}?triggerNew=true&content=${encodedContent}&source=extension&pageUrl=${encodedPageUrl}&pageTitle=${encodedPageTitle}`;
        console.log('Smart destination found - Space:', targetSpaceId, 'Folder:', targetFolderId);
      } else {
        // 回退到根路由，利用後台的自動重導向邏輯
        targetUrl = `${baseUrl}/prompts?triggerNew=true&content=${encodedContent}&source=extension&pageUrl=${encodedPageUrl}&pageTitle=${encodedPageTitle}`;
        console.log('Fallback to /prompts - no specific folder found, will use auto-redirect');
      }

      console.log('Target URL:', targetUrl);

      // 開啟新分頁跳轉到後台
      chrome.tabs.create({ url: targetUrl });
    } catch (error) {
      console.error('Error in addToPromptBear:', error);
    }
  }
});

// 建立一個處理器映射物件
const messageHandlers: Record<string, (message: RuntimeMessage, sendResponse: (response?: any) => void) => void> = {
  createWindow: (message, sendResponse) =>
    handleCreatePopupWindow(message as Extract<RuntimeMessage, { action: 'createWindow' }>, sendResponse),
  getPopupData: (_, sendResponse) => sendResponse({ data: popupData }),
  submitForm: (message, sendResponse) =>
    handleFormSubmission(message as Extract<RuntimeMessage, { action: 'submitForm' }>, sendResponse),
  // 側邊欄相關處理
  sidePanelInsertPrompt: (message, sendResponse) =>
    handleSidePanelInsert(message as Extract<RuntimeMessage, { action: 'sidePanelInsertPrompt' }>, sendResponse),
  // 開啟快捷鍵設定頁面
  openShortcutsPage: (_, sendResponse) => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    sendResponse({ success: true });
  },
  getFolders: async (_, sendResponse) => {
    try {
      const { userLoggedIn } = await chrome.storage.local.get('userLoggedIn');
      if (!userLoggedIn) {
        sendResponse({ success: false, error: '使用者未登入' });
        return;
      }

      // First fetch prompt spaces to get a default space ID
      const promptSpacesResult = await fetchPromptSpaces();
      if (!promptSpacesResult.success || !promptSpacesResult.data) {
        sendResponse({ success: false, error: 'Failed to fetch prompt spaces' });
        return;
      }

      // Get default prompt space ID using centralized logic
      const defaultSpaceId = getDefaultSpaceIdFromApiData(promptSpacesResult.data);
      if (!defaultSpaceId) {
        sendResponse({ success: false, error: 'No prompt space available' });
        return;
      }

      // 先清除本地快取，確保取得最新資料
      await chrome.storage.local.remove(['folders', 'prompts']);
      const result = await fetchFolders(defaultSpaceId);
      console.log('Fetched folders (force refresh):', result);
      if (result.success && result.folders) {
        sendResponse({ success: true, data: result.folders });
      } else {
        sendResponse({ success: false, error: result.error || 'unknown error' });
      }
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message || 'unknown error' });
    }
  },
  getPromptSpaces: async (_, sendResponse) => {
    try {
      const { userLoggedIn } = await chrome.storage.local.get('userLoggedIn');
      if (!userLoggedIn) {
        sendResponse({ success: false, error: 'User not logged in' });
        return;
      }

      const result = await fetchPromptSpaces();
      console.log('Fetched prompt spaces:', result);
      if (result.success && result.data) {
        sendResponse({ success: true, data: result.data });
      } else {
        sendResponse({ success: false, error: result.error || 'unknown error' });
      }
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message || 'unknown error' });
    }
  },
  getSpaceFolders: async (message, sendResponse) => {
    try {
      const { userLoggedIn } = await chrome.storage.local.get('userLoggedIn');
      if (!userLoggedIn) {
        sendResponse({ success: false, error: 'User not logged in' });
        return;
      }

      const { promptSpaceId } = message as Extract<RuntimeMessage, { action: 'getSpaceFolders' }>;
      const result = await fetchSpaceFolders(promptSpaceId);
      console.log('Fetched space folders:', result);
      if (result.success && result.data) {
        sendResponse({ success: true, data: result.data });
      } else {
        sendResponse({ success: false, error: result.error || 'unknown error' });
      }
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message || 'unknown error' });
    }
  },
  updateIcon: async (message, sendResponse) => {
    const { userLoggedIn } = await chrome.storage.local.get('userLoggedIn');
    chrome.action.setIcon({ path: userLoggedIn ? 'icon-34.png' : 'icon-34-gray.png' });
    sendResponse({ success: true });
  },
  updateUserStatusFromClient: (message, sendResponse) => {
    const { data, domain } = message as Extract<
      RuntimeMessage,
      { action: 'updateUserStatusFromClient'; data: { status: 'loggedIn' | 'loggedOut' }; domain: string }
    >;

    // 根據實際登入狀態設置正確的 icon
    const isLoggedIn = data.status === 'loggedIn';
    const iconPath = isLoggedIn ? 'icon-34.png' : 'icon-34-gray.png';

    chrome.action.setIcon({ path: iconPath }, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        chrome.storage.local.set({ userLoggedIn: isLoggedIn, apiDomain: domain }, async () => {
          if (isLoggedIn) {
            const defaultSpaceId = await getDefaultSpaceIdFromCache();
            if (defaultSpaceId) {
              await fetchFolders(defaultSpaceId);
            }
          }
          sendResponse({ success: true, message: 'user status updated' });
        });
      }
    });
  },
  userLoggedOut: (_, sendResponse) => {
    chrome.action.setIcon({ path: 'icon-34-gray.png' });
    chrome.storage.local.clear(() => {
      sendResponse({ success: true });
    });
  },
  getPromptByShortcut: async (message, sendResponse) => {
    const { shortcut } = message as { action: 'getPromptByShortcut'; shortcut: string };

    try {
      // 從本地快取中查找 prompts
      const { prompts } = await chrome.storage.local.get('prompts');
      if (prompts && typeof prompts === 'object') {
        sendResponse({ success: true, prompt: prompts[shortcut] });
        return;
      }

      // 如果本地沒有 prompts，觸發 fetchFolders
      const defaultSpaceId = await getDefaultSpaceIdFromCache();
      if (!defaultSpaceId) {
        sendResponse({ success: false, error: 'No prompt space available' });
        return;
      }

      const fetchResult = await fetchFolders(defaultSpaceId);
      if (!fetchResult.success) {
        sendResponse({ success: false, error: 'Unable to fetch folders' });
        return;
      }

      // 再次從本地快取中查找 prompts
      const { prompts: updatedPrompts } = await chrome.storage.local.get('prompts');
      const prompt = updatedPrompts?.[shortcut];
      if (prompt) {
        sendResponse({ success: true, prompt });
      } else {
        sendResponse({ success: false, error: 'Prompt not found' });
      }
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message || 'Unknown error' });
    }
  },
};

function handleCreatePopupWindow(
  message: Extract<RuntimeMessage, { action: 'createWindow' }>,
  sendResponse: (response?: any) => void,
) {
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

function handleFormSubmission(
  message: Extract<RuntimeMessage, { action: 'submitForm' }>,
  sendResponse: (response?: any) => void,
) {
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

function handleSidePanelInsert(
  message: Extract<RuntimeMessage, { action: 'sidePanelInsertPrompt' }>,
  sendResponse: (response?: any) => void,
) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs || !tabs[0]?.id) {
      sendResponse({ success: false, error: 'No active tab found.' });
      return;
    }

    const { content, shortcut, name } = message.prompt;
    const title = `${shortcut} - ${name}`;

    chrome.tabs.sendMessage(tabs[0].id, { action: 'insertPrompt', prompt: content, title }, response => {
      sendResponse({ success: true, response });
    });
  });
}

// 初始化
async function initializeIcon(): Promise<void> {
  const { userLoggedIn } = await chrome.storage.local.get('userLoggedIn');
  const iconPath = userLoggedIn ? 'icon-34.png' : 'icon-34-gray.png';
  chrome.action.setIcon({ path: iconPath });
}

function initializeEventListeners(): void {
  setupExtensionControls();
  chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
    const handler = messageHandlers[message.action];
    if (handler) {
      (async () => {
        try {
          await handler(message, sendResponse);
        } catch (err: any) {
          sendResponse({ success: false, error: err.message });
        }
      })();
      return true;
    }

    console.warn(`未處理的 action: ${message.action}`);
    return false;
  });
}

async function initialize(): Promise<void> {
  await initializeIcon();
  initializeEventListeners();
}

initialize();
