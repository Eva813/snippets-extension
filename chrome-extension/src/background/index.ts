/* eslint-disable @typescript-eslint/no-explicit-any */
import 'webextension-polyfill';
import { fetchFolders } from './utils/fetchFolders';

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
  | { action: 'updateIcon'; hasFolders: boolean }
  | { action: 'updateUserStatusFromClient'; data: { status: 'loggedIn' | 'loggedOut' }; domain: string }
  | { action: 'userLoggedOut' }
  | { action: 'getPromptByShortcut'; shortcut: string };

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

      // 先清除本地快取，確保取得最新資料
      await chrome.storage.local.remove(['folders', 'prompts']);
      const result = await fetchFolders();
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
    chrome.action.setIcon({ path: 'icon-34.png' }, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        chrome.storage.local.set({ userLoggedIn: data.status === 'loggedIn', apiDomain: domain }, async () => {
          if (data.status === 'loggedIn') await fetchFolders();
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
      const fetchResult = await fetchFolders();
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
