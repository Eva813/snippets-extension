import { StorageService } from '../../services/storageService';
import { fetchFolders } from '../../utils/fetchFolders';
import { fetchPromptSpaces } from '../../utils/fetchPromptSpaces';
import { fetchSpaceFolders } from '../../utils/fetchSpaceFolders';
import { fetchSharedFolders } from '../../utils/fetchSharedFolders';
import { fetchSharedFolderDetails, fetchPublicFolder } from '../../utils/fetchSharedFolderDetails';
import { getDefaultSpaceIdFromApiData } from '../../utils/getDefaultSpaceId';
import type { ActionHandler } from '../../types/utils';
import type {
  FoldersResponse,
  SharedFoldersResponse,
  SharedFolderDetailsResponse,
  PublicFolderResponse,
} from '../../types/responses';

export class FolderFeature {
  static getFolders: ActionHandler<'getFolders', FoldersResponse> = async (_message, sendResponse) => {
    try {
      const userLoggedIn = await StorageService.getUserLoginStatus();
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
      await StorageService.removeMultiple(['folders', 'prompts']);
      const result = await fetchFolders(defaultSpaceId);
      if (result.success && result.folders) {
        sendResponse({ success: true, data: result.folders });
      } else {
        sendResponse({ success: false, error: result.error || 'unknown error' });
      }
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message || 'unknown error' });
    }
  };

  static getSpaceFolders: ActionHandler<'getSpaceFolders', FoldersResponse> = async (message, sendResponse) => {
    try {
      const userLoggedIn = await StorageService.getUserLoginStatus();
      if (!userLoggedIn) {
        sendResponse({ success: false, error: 'User not logged in' });
        return;
      }

      const { promptSpaceId } = message;
      const result = await fetchSpaceFolders(promptSpaceId);
      if (result.success && result.data) {
        sendResponse({ success: true, data: result.data });
      } else {
        sendResponse({ success: false, error: result.error || 'unknown error' });
      }
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message || 'unknown error' });
    }
  };

  static getSharedFolders: ActionHandler<'getSharedFolders', SharedFoldersResponse> = async (
    _message,
    sendResponse,
  ) => {
    try {
      const userLoggedIn = await StorageService.getUserLoginStatus();
      if (!userLoggedIn) {
        sendResponse({ success: false, error: 'User not logged in' });
        return;
      }

      const result = await fetchSharedFolders();
      if (result.success && result.data) {
        sendResponse({ success: true, data: result.data });
      } else {
        sendResponse({ success: false, error: result.error || 'unknown error' });
      }
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message || 'Unknown error' });
    }
  };

  static getSharedFolderDetails: ActionHandler<'getSharedFolderDetails', SharedFolderDetailsResponse> = async (
    message,
    sendResponse,
  ) => {
    try {
      const userLoggedIn = await StorageService.getUserLoginStatus();
      if (!userLoggedIn) {
        sendResponse({ success: false, error: 'User not logged in' });
        return;
      }

      const { folderId } = message;
      const result = await fetchSharedFolderDetails(folderId);
      if (result.success && result.data) {
        sendResponse({ success: true, data: result.data });
      } else {
        sendResponse({ success: false, error: result.error || 'unknown error' });
      }
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message || 'unknown error' });
    }
  };

  static refreshSharedFolders: ActionHandler<'refreshSharedFolders', SharedFoldersResponse> = async (
    _message,
    sendResponse,
  ) => {
    try {
      // Clear cache first
      await StorageService.removeMultiple([
        'sharedFolders',
        'sharedFoldersTimestamp',
        'sharedPromptsCache',
        'sharedPromptsCacheTimestamp',
      ]);

      const result = await fetchSharedFolders();
      if (result.success && result.data) {
        sendResponse({ success: true, data: result.data });
      } else {
        sendResponse({ success: false, error: result.error || 'unknown error' });
      }
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message || 'unknown error' });
    }
  };

  static getPublicFolder: ActionHandler<'getPublicFolder', PublicFolderResponse> = async (message, sendResponse) => {
    try {
      const { shareToken } = message;

      const result = await fetchPublicFolder(shareToken);

      if (result.success && result.data) {
        sendResponse({ success: true, data: result.data });
      } else {
        sendResponse({ success: false, error: result.error || 'unknown error' });
      }
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message || 'unknown error' });
    }
  };
}
