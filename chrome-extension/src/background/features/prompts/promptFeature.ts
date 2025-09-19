import { StorageService } from '../../services/storageService';
import { CacheService } from '../../services/cacheService';
import { NotificationService } from '../../services/notificationService';
import { fetchFolders } from '../../utils/fetchFolders';
import { fetchSharedFolders } from '../../utils/fetchSharedFolders';
import { fetchSharedFolderDetails } from '../../utils/fetchSharedFolderDetails';
import { getDefaultSpaceIdFromCache } from '../../utils/getDefaultSpaceId';
import { createPrompt } from '../../utils/createPrompt';
import { getApiDomain } from '../../config/api';
import { sanitizePageTitle } from '../../utils/pageUtils';
import { SHARED_PROMPTS_CACHE_TTL } from '../../utils/constants';
import { logger } from '../../../../../packages/shared/lib/logging/logger';
import type { ActionHandler } from '../../types/utils';
import type { PromptResponse, DataResponse } from '../../types/responses';

// 共享 Prompt 類型定義
interface SharedPrompt {
  id: string;
  name: string;
  content: string;
  contentJSON?: unknown;
  shortcut: string;
  isShared: true;
  sharedFrom: string;
  folderId: string;
  folderName: string;
}

export class PromptFeature {
  static getPromptByShortcut: ActionHandler<'getPromptByShortcut', PromptResponse> = async (message, sendResponse) => {
    const { shortcut } = message;

    try {
      // 1. 優先從本地快取中查找 prompts
      const prompts = (await StorageService.get('prompts')) as Record<string, unknown> | null;

      if (prompts && typeof prompts === 'object') {
        const foundPrompt = prompts[shortcut];
        if (foundPrompt) {
          sendResponse({ success: true, data: foundPrompt });
          return;
        }
      }

      // 2. 如果本地沒有 prompts，觸發 fetchFolders
      const defaultSpaceId = await getDefaultSpaceIdFromCache();
      if (!defaultSpaceId) {
        // 如果沒有默認 space，直接查找共享 prompts
        const sharedPrompt = await this.getSharedPromptByShortcut(shortcut);
        if (sharedPrompt) {
          sendResponse({ success: true, data: sharedPrompt });
          return;
        }
        sendResponse({ success: false, error: 'No prompt space available and no shared prompt found' });
        return;
      }

      const fetchResult = await fetchFolders(defaultSpaceId);
      if (!fetchResult.success) {
        // 如果 fetchFolders 失敗，嘗試查找共享 prompts
        const sharedPrompt = await this.getSharedPromptByShortcut(shortcut);
        if (sharedPrompt) {
          sendResponse({ success: true, data: sharedPrompt });
          return;
        }
        sendResponse({ success: false, error: 'Unable to fetch folders and no shared prompt found' });
        return;
      }

      // 3. 再次從本地快取中查找 prompts
      const updatedPrompts = (await StorageService.get('prompts')) as Record<string, unknown> | null;
      const prompt = updatedPrompts?.[shortcut];
      if (prompt) {
        sendResponse({ success: true, data: prompt });
        return;
      }

      // 4. 最後嘗試查找共享 prompts
      const sharedPrompt = await this.getSharedPromptByShortcut(shortcut);
      if (sharedPrompt) {
        sendResponse({ success: true, data: sharedPrompt });
        return;
      }

      sendResponse({ success: false, error: 'Prompt not found in local or shared folders' });
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message || 'Unknown error' });
    }
  };

  static sidePanelInsertPrompt: ActionHandler<'sidePanelInsertPrompt', DataResponse> = async (
    message,
    sendResponse,
  ) => {
    const { prompt } = message;

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs || !tabs[0]?.id) {
        sendResponse({ success: false, error: 'No active tab found.' });
        return;
      }

      const { content, contentJSON, shortcut, name } = prompt;
      const title = `${shortcut} - ${name}`;

      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          action: 'insertPrompt',
          prompt: content,
          promptJSON: contentJSON,
          title,
        },
        response => {
          sendResponse({ success: true, data: response });
        },
      );
    });
  };

  static async addToPromptBearFromContextMenu(selectedText: string, pageUrl: string, pageTitle: string): Promise<void> {
    const cleanTitle = sanitizePageTitle(pageTitle);

    logger.log('=== Add to PromptBear (New API) ===');

    try {
      // 檢查用戶登入狀態
      const userLoggedIn = await StorageService.getUserLoginStatus();
      if (!userLoggedIn) {
        logger.warn('❌ User not logged in, cannot add to PromptBear');
        return;
      }

      // 預檢查：驗證基本條件
      if (!selectedText.trim()) {
        return;
      }

      // 智能選擇目標 Space 和 Folder (需要從 spaceFeature 導入)
      // 暫時先用簡化版本
      const defaultSpaceId = await getDefaultSpaceIdFromCache();
      if (!defaultSpaceId) {
        return;
      }

      // 使用新的 API 直接創建 prompt
      const result = await createPrompt({
        content: selectedText,
        pageTitle: cleanTitle,
        pageUrl: pageUrl,
        promptSpaceId: defaultSpaceId,
      });

      if (result.success && result.data) {
        await this.openPromptPage(result.data.id, defaultSpaceId);
      } else {
        logger.error('Failed to create prompt:', result.error);

        // 根據錯誤類型提供不同的處理
        if (result.error?.includes('not logged in') || result.error?.includes('user ID')) {
          logger.warn('🔐 Authentication issue, user may need to re-login');
        } else if (result.error?.includes('not found')) {
          logger.warn('🔍 Space or folder not found, may need to refresh spaces list');
        } else {
          logger.error('💥 Unexpected error:', result.error);
        }
      }
    } catch (error) {
      logger.error('❌ Critical error in addToPromptBear:', error instanceof Error ? error.message : String(error));
    }
  }

  private static async openPromptPage(promptId: string, spaceId?: string): Promise<void> {
    try {
      const baseUrl = await getApiDomain();
      let promptUrl = `${baseUrl}/prompts/prompt/${promptId}`;

      if (spaceId) {
        promptUrl += `?spaceId=${spaceId}`;
      }

      if (!chrome?.tabs?.create) {
        throw new Error('chrome.tabs.create is not available in this context');
      }

      await chrome.tabs.create({ url: promptUrl });
      await NotificationService.showSuccess('Prompt 建立成功', '已建立 Prompt 並開啟編輯頁面');
    } catch (error) {
      await NotificationService.showError('無法開啟分頁', 'Prompt 已建立，請手動前往 PromptBear 查看');
      throw error;
    }
  }

  private static async getSharedPromptByShortcut(shortcut: string): Promise<SharedPrompt | null> {
    try {
      // 1. First try to get from cache
      const sharedPromptsCache = await StorageService.get('sharedPromptsCache');
      const sharedPromptsCacheTimestamp = await StorageService.get('sharedPromptsCacheTimestamp');

      // Check if cache is valid (less than 5 minutes old)
      const isCacheValid = CacheService.isCacheValid(
        sharedPromptsCacheTimestamp as number | undefined,
        SHARED_PROMPTS_CACHE_TTL,
      );

      if (isCacheValid && sharedPromptsCache && typeof sharedPromptsCache === 'object') {
        const typedCache = sharedPromptsCache as Record<string, SharedPrompt>;
        if (typedCache[shortcut]) {
          return typedCache[shortcut];
        }
      }

      // 2. If cache is invalid or doesn't contain the shortcut, refresh shared prompts
      const sharedFoldersResult = await fetchSharedFolders();
      if (!sharedFoldersResult.success || !sharedFoldersResult.data) {
        return null;
      }

      // 3. Build flattened prompts cache from all shared folders
      const flattenedPrompts: Record<string, SharedPrompt> = {};

      // Fetch all folder details in parallel for better performance
      const folderDetailPromises = sharedFoldersResult.data.folders.map(async folder => {
        try {
          const folderDetailsResult = await fetchSharedFolderDetails(folder.id);
          if (folderDetailsResult.success && folderDetailsResult.data) {
            return {
              folder,
              prompts: folderDetailsResult.data.prompts,
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch details for shared folder ${folder.id}:`, error);
          // Return null for failed folders, continue with others
        }
        return null;
      });

      const folderResults = await Promise.all(folderDetailPromises);

      // Process all successful results
      for (const result of folderResults) {
        if (result) {
          const { folder, prompts } = result;

          // Add each prompt to the flattened cache
          for (const prompt of prompts) {
            if (prompt.shortcut) {
              flattenedPrompts[prompt.shortcut] = {
                id: prompt.id,
                name: prompt.name,
                content: prompt.content,
                contentJSON: prompt.contentJSON,
                shortcut: prompt.shortcut,
                // Add metadata to identify this as a shared prompt
                isShared: true,
                sharedFrom: folder.sharedFrom,
                folderId: folder.id,
                folderName: folder.name,
              };
            }
          }
        }
      }

      // 4. Cache the flattened prompts
      await CacheService.setCacheWithTimestamp('sharedPromptsCache', flattenedPrompts, 'sharedPromptsCacheTimestamp');

      // 5. Return the requested prompt if found
      return flattenedPrompts[shortcut] || null;
    } catch (error) {
      console.error('Error in getSharedPromptByShortcut:', error);
      return null;
    }
  }
}
