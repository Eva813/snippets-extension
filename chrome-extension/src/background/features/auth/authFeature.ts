import { StorageService } from '../../services/storageService';
import { NotificationService } from '../../services/notificationService';
import { fetchFolders } from '../../utils/fetchFolders';
import { getDefaultSpaceIdFromCache } from '../../utils/getDefaultSpaceId';
import { logger } from '../../../../../packages/shared/lib/logging/logger';
import type { ActionHandler } from '../../types/utils';
import type { UserStatusUpdateResponse, BaseResponse, IconUpdateResponse } from '../../types/responses';
import type { VersionCheckApiResponse } from '../../types/version';

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
          logger.log('🔍 User logged in, checking version compatibility...');

          // 版本檢查
          const extensionVersion = chrome.runtime.getManifest().version;
          logger.log(`🔢 Extension version: ${extensionVersion}`);
          logger.log(`🌐 API Domain: ${domain}`);

          try {
            const url = `${domain}/api/v1/extension/version-check`;
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'x-extension-version': extensionVersion,
                'x-vercel-protection-bypass': import.meta.env.VITE_VERCEL_PREVIEW_BYPASS || '',
              },
              credentials: 'include',
              mode: 'cors',
            });

            if (response.ok) {
              const versionCheck: VersionCheckApiResponse = await response.json();
              logger.log(`📊 Version check result on login: versionMatched=${versionCheck.versionMatched}`);

              if (versionCheck.versionMatched === false) {
                logger.warn('🚨 VERSION MISMATCH on login - Blocking login!');
                logger.warn(`🚨 User has: ${extensionVersion} | Backend requires: ${versionCheck.requiredVersion}`);

                // 清除剛剛設置的登入狀態
                await StorageService.clear();
                chrome.action.setIcon({ path: 'icon-34-gray.png' });

                // 顯示通知
                await NotificationService.showWarning(
                  'Extension Version Mismatch',
                  versionCheck.message ||
                    `Your version (${extensionVersion}) must match exactly ${versionCheck.requiredVersion}.`,
                );

                // 返回錯誤
                sendResponse({
                  success: false,
                  error: 'VERSION_MISMATCH',
                  message: versionCheck.message,
                });
                return;
              } else {
                logger.log('✅ Version check passed, continuing login...');
              }
            } else {
              logger.warn('⚠️ Version check API failed on login, but allowing login to proceed (degradation)');
            }
          } catch (error) {
            logger.error('⚠️ Version check error on login:', error instanceof Error ? error.message : String(error));
            logger.log('⚠️ Allowing login to proceed despite version check error (degradation)');
          }

          // 版本檢查通過或失敗（降級），繼續正常登入流程
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
