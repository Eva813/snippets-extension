/* eslint-disable @typescript-eslint/no-explicit-any */
import 'webextension-polyfill';

// 核心基礎設施
import { MessageRouter } from './core/messageRouter';
import { EventManager } from './core/eventManager';

// 功能層
import { PromptFeature } from './features/prompts/promptFeature';
import { FolderFeature } from './features/folders/folderFeature';
import { SpaceFeature } from './features/spaces/spaceFeature';
import { AuthFeature } from './features/auth/authFeature';
import { UIFeature } from './features/ui/uiFeature';

// 工具層
import { sanitizePageTitle } from './utils/pageUtils';
import { logger } from '../../../packages/shared/lib/logging/logger';

// 初始化核心系統
const messageRouter = new MessageRouter();
const eventManager = new EventManager();

// 註冊功能處理器
function registerMessageHandlers(): void {
  // UI 相關
  messageRouter.register('createWindow', UIFeature.createWindow);
  messageRouter.register('getPopupData', UIFeature.getPopupData);
  messageRouter.register('submitForm', UIFeature.submitForm);
  messageRouter.register('openShortcutsPage', UIFeature.openShortcutsPage);

  // Prompt 相關
  messageRouter.register('getPromptByShortcut', PromptFeature.getPromptByShortcut);
  messageRouter.register('sidePanelInsertPrompt', PromptFeature.sidePanelInsertPrompt);

  // 資料夾相關
  messageRouter.register('getFolders', FolderFeature.getFolders);
  messageRouter.register('getSpaceFolders', FolderFeature.getSpaceFolders);
  messageRouter.register('getSharedFolders', FolderFeature.getSharedFolders);
  messageRouter.register('getSharedFolderDetails', FolderFeature.getSharedFolderDetails);
  messageRouter.register('refreshSharedFolders', FolderFeature.refreshSharedFolders);
  messageRouter.register('getPublicFolder', FolderFeature.getPublicFolder);

  // Space 相關
  messageRouter.register('getPromptSpaces', SpaceFeature.getPromptSpaces);
  messageRouter.register('setDefaultSpace', SpaceFeature.setDefaultSpace);
  messageRouter.register('invalidatePromptSpacesCache', SpaceFeature.invalidatePromptSpacesCache);

  // 認證相關
  messageRouter.register('updateUserStatusFromClient', AuthFeature.updateUserStatusFromClient);
  messageRouter.register('userLoggedOut', AuthFeature.userLoggedOut);
  messageRouter.register('updateIcon', AuthFeature.updateIcon);
}

// Context Menu 處理器
async function handleContextMenuClick(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab): Promise<void> {
  if (info.menuItemId === 'addToPromptBear') {
    const selectedText = info.selectionText || '';
    const pageUrl = tab?.url || '';
    const pageTitle = sanitizePageTitle(tab?.title || '');

    try {
      await PromptFeature.addToPromptBearFromContextMenu(selectedText, pageUrl, pageTitle);
    } catch (error) {
      logger.error('❌ Error in context menu handler:', error instanceof Error ? error.message : String(error));
    }
  }
}

// 初始化應用程式
async function initialize(): Promise<void> {
  try {
    // 初始化圖示
    await AuthFeature.initializeIcon();

    // 註冊訊息處理器
    registerMessageHandlers();

    // 設置訊息路由
    messageRouter.setupMessageListener();

    // 設置事件管理
    eventManager.init();
    eventManager.setupContextMenuHandler(handleContextMenuClick);

    logger.log('🚀 Background script initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize background script:', error instanceof Error ? error.message : String(error));
  }
}

// 啟動應用程式
initialize();
