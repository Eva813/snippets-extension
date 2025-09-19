import { StorageService } from '../../services/storageService';
import { fetchFolders } from '../../utils/fetchFolders';
import { getDefaultSpaceIdFromCache } from '../../utils/getDefaultSpaceId';
import type { ActionHandler } from '../../types/utils';
import type { UserStatusUpdateResponse, BaseResponse, IconUpdateResponse } from '../../types/responses';

export class AuthFeature {
  static updateUserStatusFromClient: ActionHandler<'updateUserStatusFromClient', UserStatusUpdateResponse> = async (
    message,
    sendResponse,
  ) => {
    const { data, domain } = message;

    // 根據實際登入狀態設置正確的 icon
    const isLoggedIn = data.status === 'loggedIn';
    const iconPath = isLoggedIn ? 'icon-34.png' : 'icon-34-gray.png';

    chrome.action.setIcon({ path: iconPath }, async () => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        await StorageService.setMultiple({
          userLoggedIn: isLoggedIn,
          apiDomain: domain,
        });

        if (isLoggedIn) {
          const defaultSpaceId = await getDefaultSpaceIdFromCache();
          if (defaultSpaceId) {
            await fetchFolders(defaultSpaceId);
          }
        }
        sendResponse({ success: true, message: 'user status updated' });
      }
    });
  };

  static userLoggedOut: ActionHandler<'userLoggedOut', BaseResponse> = async (_message, sendResponse) => {
    chrome.action.setIcon({ path: 'icon-34-gray.png' });
    await StorageService.clear();
    sendResponse({ success: true });
  };

  static updateIcon: ActionHandler<'updateIcon', IconUpdateResponse> = async (_message, sendResponse) => {
    const userLoggedIn = await StorageService.getUserLoginStatus();
    chrome.action.setIcon({ path: userLoggedIn ? 'icon-34.png' : 'icon-34-gray.png' });
    sendResponse({ success: true });
  };

  static async initializeIcon(): Promise<void> {
    const userLoggedIn = await StorageService.getUserLoginStatus();
    const iconPath = userLoggedIn ? 'icon-34.png' : 'icon-34-gray.png';
    chrome.action.setIcon({ path: iconPath });
  }
}
