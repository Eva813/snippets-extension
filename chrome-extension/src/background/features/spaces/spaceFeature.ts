import { StorageService } from '../../services/storageService';
import { CacheService } from '../../services/cacheService';
import { fetchPromptSpaces } from '../../utils/fetchPromptSpaces';
import { fetchSpaceFolders } from '../../utils/fetchSpaceFolders';
import { setDefaultSpace } from '../../utils/setDefaultSpace';
import { getDefaultSpaceIdFromApiData } from '../../utils/getDefaultSpaceId';
import { getAllAvailableSpaces, isSpaceValid, selectBestFolder } from '../../utils/spaceUtils';
import { PROMPT_SPACES_CACHE_TTL, EMPTY_DESTINATION } from '../../utils/constants';
import type { SmartDestination } from '../../utils/constants';
import type { ActionHandler } from '../../types/utils';
import type { SpacesResponse, SetDefaultSpaceResponse, CacheClearResponse } from '../../types/responses';
import { logger } from '../../../../../packages/shared/lib/logging/logger';

export class SpaceFeature {
  static getPromptSpaces: ActionHandler<'getPromptSpaces', SpacesResponse> = async (_message, sendResponse) => {
    try {
      const userLoggedIn = await StorageService.getUserLoginStatus();
      if (!userLoggedIn) {
        sendResponse({ success: false, error: 'User not logged in' });
        return;
      }

      const result = await fetchPromptSpaces();
      if (result.success && result.data) {
        sendResponse({ success: true, data: result.data });
      } else {
        sendResponse({ success: false, error: result.error || 'unknown error' });
      }
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message || 'unknown error' });
    }
  };

  static setDefaultSpace: ActionHandler<'setDefaultSpace', SetDefaultSpaceResponse> = async (message, sendResponse) => {
    try {
      const userLoggedIn = await StorageService.getUserLoginStatus();
      if (!userLoggedIn) {
        sendResponse({ success: false, error: 'User not logged in' });
        return;
      }

      const { spaceId } = message;

      // 立即儲存到本地作為當前預設空間
      await StorageService.setCurrentDefaultSpaceId(spaceId);

      const result = await setDefaultSpace(spaceId);
      if (result.success) {
        sendResponse({ success: true, data: result.data });
      } else {
        logger.error('❌ Failed to set default space:', result.error);
        // 如果 API 失敗，仍然保留本地設定，以便 addToPromptBear 可以使用
        sendResponse({ success: true, warning: 'Local setting saved, but API call failed' });
      }
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message || 'Unknown error' });
    }
  };

  static invalidatePromptSpacesCache: ActionHandler<'invalidatePromptSpacesCache', CacheClearResponse> = async (
    _message,
    sendResponse,
  ) => {
    try {
      await StorageService.removeMultiple(['promptSpaces', 'promptSpacesTimestamp']);
      sendResponse({ success: true });
    } catch (error) {
      logger.error('❌ Error clearing prompt spaces cache:', error as Error);
      sendResponse({ success: false, error: (error as Error).message || 'Unknown error' });
    }
  };

  static async getSmartDestination(): Promise<SmartDestination> {
    try {
      // === STEP 1: Get User Preferences ===
      const userSelectedSpaceId = await StorageService.getCurrentDefaultSpaceId();

      // === STEP 2: Get Spaces Data (with Smart Caching) ===
      const spacesResult = await CacheService.getOrFetch(
        'promptSpaces',
        () => fetchPromptSpaces(),
        PROMPT_SPACES_CACHE_TTL,
        'promptSpacesTimestamp',
      );

      if (!spacesResult.success || !spacesResult.data) {
        return EMPTY_DESTINATION;
      }

      // === STEP 3: Select Target Space ===
      let targetSpaceId: string | null = null;

      // 優先使用 side panel 設定的預設空間（如果有效）
      if (userSelectedSpaceId) {
        const allAvailableSpaces = getAllAvailableSpaces(spacesResult.data);

        if (isSpaceValid(userSelectedSpaceId, allAvailableSpaces)) {
          targetSpaceId = userSelectedSpaceId;
        } else {
          logger.warn('⚠️ Side panel selected space no longer exists, falling back to API default');
        }
      }

      // 回退：使用 API 回傳的預設空間
      if (!targetSpaceId) {
        targetSpaceId = getDefaultSpaceIdFromApiData(spacesResult.data);
      }

      if (!targetSpaceId) {
        return EMPTY_DESTINATION;
      }

      // === STEP 4: Select Target Folder ===
      const foldersResult = await fetchSpaceFolders(targetSpaceId);
      if (!foldersResult.success || !foldersResult.data || foldersResult.data.length === 0) {
        logger.warn('⚠️ No folders found in space:', targetSpaceId, '- returning space only');
        return { targetSpaceId, targetFolderId: null };
      }

      const selectedFolder = selectBestFolder(foldersResult.data);
      return {
        targetSpaceId,
        targetFolderId: selectedFolder.id,
      };
    } catch (error) {
      logger.error('❌ Critical error in getSmartDestination:', error instanceof Error ? error.message : String(error));
      return EMPTY_DESTINATION;
    }
  }
}
