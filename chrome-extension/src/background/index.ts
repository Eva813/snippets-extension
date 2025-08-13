/* eslint-disable @typescript-eslint/no-explicit-any */
import 'webextension-polyfill';
import { fetchFolders } from './utils/fetchFolders';
import { fetchPromptSpaces } from './utils/fetchPromptSpaces';
import { fetchSpaceFolders, type FolderData } from './utils/fetchSpaceFolders';
import { getDefaultSpaceIdFromApiData, getDefaultSpaceIdFromCache } from './utils/getDefaultSpaceId';
import { setDefaultSpace } from './utils/setDefaultSpace';
import { createPrompt } from './utils/createPrompt';
import { openLoginPage } from './config/api';

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
  | { action: 'addToPromptBear'; selectedText: string; pageUrl?: string; pageTitle?: string }
  | { action: 'setDefaultSpace'; spaceId: string };

// 全域狀態
let popupData: PopupData | null = null;
let targetTabId: number | null | undefined = null;

/**
 * 本地實作 openPromptPage 函式，確保在 background context 中運行
 */
async function openPromptPage(promptId: string, spaceId?: string): Promise<void> {
  try {
    console.log('🔗 Opening prompt page:', { promptId, spaceId });

    const { apiDomain } = await chrome.storage.local.get(['apiDomain']);
    const baseUrl = apiDomain || 'http://localhost:3000';
    let promptUrl = `${baseUrl}/prompts/prompt/${promptId}`;

    // 如果有 spaceId，添加查詢參數
    if (spaceId) {
      promptUrl += `?spaceId=${spaceId}`;
    }

    console.log('🔗 Final prompt URL:', promptUrl);

    // 檢查 chrome.tabs 是否可用
    if (!chrome?.tabs?.create) {
      throw new Error('chrome.tabs.create is not available in this context');
    }

    const tab = await chrome.tabs.create({ url: promptUrl });
    console.log('✅ Tab created successfully, tab ID:', tab.id);

    // 顯示成功通知
    if (chrome.notifications?.create) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon-34.png',
        title: '✅ Prompt 建立成功',
        message: `已建立 Prompt 並開啟編輯頁面`,
      });
    }
  } catch (error) {
    console.error('❌ Failed to open prompt page:', error);

    // 顯示錯誤通知
    if (chrome.notifications?.create) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon-34-gray.png',
        title: '❌ 無法開啟分頁',
        message: `Prompt 已建立，請手動前往 PromptBear 查看`,
      });
    }

    throw error;
  }
}

function setupExtensionControls() {
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
  console.log('🎯 Starting smart destination selection...');

  try {
    // 1. 首先檢查是否有最近由 side panel 設定的預設空間
    const { currentDefaultSpaceId } = await chrome.storage.local.get(['currentDefaultSpaceId']);

    // 2. 強制重新獲取最新的 Spaces 資料（不使用快取）
    console.log('🔄 Fetching latest prompt spaces to ensure up-to-date default...');
    const spacesResult = await fetchPromptSpaces();
    if (!spacesResult.success || !spacesResult.data) {
      console.error('❌ Failed to fetch prompt spaces:', spacesResult.error);
      return { targetSpaceId: null, targetFolderId: null };
    }

    console.log(
      '✅ Successfully fetched spaces:',
      spacesResult.data.ownedSpaces.length,
      'owned,',
      spacesResult.data.sharedSpaces.length,
      'shared',
    );

    let targetSpaceId: string | null = null;

    // 3. 優先使用 side panel 設定的預設空間（如果有效）
    if (currentDefaultSpaceId) {
      const allSpaces = [...spacesResult.data.ownedSpaces, ...spacesResult.data.sharedSpaces.map(s => s.space)];
      const isValidSpace = allSpaces.some(space => space.id === currentDefaultSpaceId);

      if (isValidSpace) {
        targetSpaceId = currentDefaultSpaceId;
        console.log(
          '🎯 Using side panel selected default space:',
          getSpaceNameById(spacesResult.data, currentDefaultSpaceId),
          '(ID:',
          currentDefaultSpaceId,
          ')',
        );
      } else {
        console.warn('⚠️ Side panel selected space no longer exists, falling back to API default');
      }
    }

    // 4. 如果沒有有效的 side panel 設定，使用 API 回傳的預設空間
    if (!targetSpaceId) {
      targetSpaceId = getDefaultSpaceIdFromApiData(spacesResult.data);
      if (targetSpaceId) {
        const selectedSpaceName = getSpaceNameById(spacesResult.data, targetSpaceId);
        console.log('🎯 Using API default space:', selectedSpaceName || 'Unknown', '(ID:', targetSpaceId, ')');
      }
    }

    if (!targetSpaceId) {
      console.warn('⚠️ No default space found in latest data');
      return { targetSpaceId: null, targetFolderId: null };
    }

    // 5. 獲取該 Space 的資料夾列表
    const foldersResult = await fetchSpaceFolders(targetSpaceId);
    if (!foldersResult.success || !foldersResult.data || foldersResult.data.length === 0) {
      console.warn('⚠️ No folders found in space:', targetSpaceId, '- returning space only');
      return { targetSpaceId, targetFolderId: null };
    }

    // 6. 選擇最佳資料夾（通常是第一個）
    const selectedFolder = selectBestFolder(foldersResult.data);
    console.log('✅ Selected target folder:', selectedFolder.name, '(ID:', selectedFolder.id, ')');

    console.log('🎉 Smart destination selection completed successfully');
    return {
      targetSpaceId,
      targetFolderId: selectedFolder.id,
    };
  } catch (error) {
    console.error('❌ Critical error in getSmartDestination:', error);
    return { targetSpaceId: null, targetFolderId: null };
  }
}

// 根據 ID 獲取 Space 名稱
function getSpaceNameById(spacesData: any, spaceId: string): string | null {
  // 在 owned spaces 中尋找
  const ownedSpace = spacesData.ownedSpaces?.find((space: any) => space.id === spaceId);
  if (ownedSpace) return ownedSpace.name;

  // 在 shared spaces 中尋找
  const sharedSpace = spacesData.sharedSpaces?.find((sharedSpace: any) => sharedSpace.space.id === spaceId);
  if (sharedSpace) return sharedSpace.space.name;

  return null;
}

// 選擇最佳資料夾
function selectBestFolder(folders: FolderData[]): FolderData {
  // 目前簡單選擇第一個，後續可以添加更智能的邏輯
  // 例如：優先選擇最近使用的、或特定命名的資料夾
  return folders[0];
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

    console.log('=== Add to PromptBear (New API) ===');
    console.log('Selected text length:', selectedText.length);
    console.log('Page URL:', pageUrl);
    console.log('Page title:', pageTitle);

    try {
      // 檢查用戶登入狀態
      const { userLoggedIn } = await chrome.storage.local.get(['userLoggedIn']);
      if (!userLoggedIn) {
        console.warn('❌ User not logged in, cannot add to PromptBear');
        // TODO: 可以在這裡顯示登入提示
        return;
      }

      // 預檢查：驗證基本條件
      if (!selectedText.trim()) {
        console.error('❌ No text selected, cannot proceed');
        return;
      }

      console.log('🔍 Starting smart destination selection...');

      // 智能選擇目標 Space 和 Folder
      const { targetSpaceId, targetFolderId } = await getSmartDestination();

      if (!targetSpaceId) {
        console.error('❌ Failed to determine target space - user may need to login to PromptBear first');
        // TODO: 可以在這裡顯示錯誤通知
        return;
      }

      console.log('✅ Smart destination selected:', {
        targetSpaceId,
        targetFolderId: targetFolderId || 'auto-select',
      });

      console.log('🚀 Creating prompt via API...');

      // 使用新的 API 直接創建 prompt
      const result = await createPrompt({
        content: selectedText,
        pageTitle: pageTitle,
        pageUrl: pageUrl,
        promptSpaceId: targetSpaceId,
        folderId: targetFolderId || undefined,
      });

      if (result.success && result.data) {
        console.log('🎉 Successfully created prompt!', {
          id: result.data.id,
          name: result.data.name,
          shortcut: result.data.shortcut,
        });

        // 跳轉到新創建的 prompt 頁面，包含 spaceId 參數
        console.log('🔗 Opening new prompt in PromptBear:', result.data.id, 'in space:', targetSpaceId);
        await openPromptPage(result.data.id, targetSpaceId);
      } else {
        console.error('❌ Failed to create prompt:', result.error);

        // 根據錯誤類型提供不同的處理
        if (result.error?.includes('not logged in') || result.error?.includes('user ID')) {
          console.warn('🔐 Authentication issue, user may need to re-login');
          // TODO: 提示用戶重新登入
        } else if (result.error?.includes('not found')) {
          console.warn('🔍 Space or folder not found, may need to refresh spaces list');
          // TODO: 可以嘗試重新獲取 spaces 並重試
        } else {
          console.error('💥 Unexpected error:', result.error);
          // TODO: 顯示通用錯誤提示
        }
      }
    } catch (error) {
      console.error('❌ Critical error in addToPromptBear:', error);
      // 這裡可以添加用戶錯誤提示，例如：
      // - 顯示 Chrome notification
      // - 記錄錯誤統計
      // - 觸發重試機制
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
  setDefaultSpace: async (message, sendResponse) => {
    try {
      const { userLoggedIn } = await chrome.storage.local.get('userLoggedIn');
      if (!userLoggedIn) {
        sendResponse({ success: false, error: 'User not logged in' });
        return;
      }

      const { spaceId } = message as Extract<RuntimeMessage, { action: 'setDefaultSpace' }>;
      console.log('🎯 Setting default space to:', spaceId);

      // 立即儲存到本地作為當前預設空間
      await chrome.storage.local.set({ currentDefaultSpaceId: spaceId });
      console.log('💾 Saved current default space to local storage');

      const result = await setDefaultSpace(spaceId);
      if (result.success) {
        console.log('✅ Successfully set default space');
        sendResponse({ success: true, data: result.data });
      } else {
        console.error('❌ Failed to set default space:', result.error);
        // 如果 API 失敗，仍然保留本地設定，以便 addToPromptBear 可以使用
        sendResponse({ success: true, warning: 'Local setting saved, but API call failed' });
      }
    } catch (error) {
      console.error('❌ Error in setDefaultSpace handler:', error);
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
