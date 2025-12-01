import { StorageService } from '../../services/storageService';
import { fetchFolders } from '../../utils/fetchFolders';
import { getDefaultSpaceIdFromCache } from '../../utils/getDefaultSpaceId';
import { logger } from '../../../../../packages/shared/lib/logging/logger';
import type { ActionHandler } from '../../types/utils';
import type {
  UserStatusUpdateResponse,
  BaseResponse,
  IconUpdateResponse,
  MessageResponse,
} from '../../types/responses';

export class AuthFeature {
  static updateUserStatusFromClient: ActionHandler<'updateUserStatusFromClient', UserStatusUpdateResponse> = async (
    message,
    sendResponse,
  ) => {
    const { data, domain } = message;

    // 根據實際登入狀態設置正確的 icon
    const isLoggedIn = data.status === 'loggedIn';
    const iconPath = isLoggedIn ? chrome.runtime.getURL('icon-34.png') : chrome.runtime.getURL('icon-34-gray.png');

    chrome.action.setIcon({ path: iconPath }, async () => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        await StorageService.setMultiple({
          userLoggedIn: isLoggedIn,
          apiDomain: domain,
        });

        if (isLoggedIn) {
          // 移除登入時的版本檢查，改為首次點擊 icon 時才檢查
          // 這樣可以避免 session cookie 時序問題導致的 API 失敗
          logger.log('✅ User logged in, loading folders...');

          const defaultSpaceId = await getDefaultSpaceIdFromCache();
          if (defaultSpaceId) {
            await fetchFolders(defaultSpaceId);
          }
        }
        sendResponse({ success: true, message: 'user status updated' });
      }
    });
  };

  /**
   * 🔧 共用的登出邏輯 - 統一處理所有登出流程
   * - 通知所有 tabs 執行登出
   * - 清除 Extension storage
   * - 更新 icon 為灰色
   */
  private static async performLogout(reason: string): Promise<void> {
    logger.log(`🚪 Logout initiated: ${reason}`);

    // 📢 通知所有後台 tabs 執行登出（透過 Content Script 轉發）
    const tabs = await chrome.tabs.query({});
    const notifyPromises = tabs.map(tab => {
      if (tab.id && tab.url?.match(/^https?:\/\//)) {
        return chrome.tabs
          .sendMessage(tab.id, {
            action: 'extensionRequestLogout',
            data: { reason },
          })
          .catch(err => {
            // 忽略無法接收訊息的 tabs（如 chrome:// 頁面）
            logger.log(`⚠️ Failed to notify tab ${tab.id}: ${err.message}`);
          });
      }
      return Promise.resolve();
    });

    await Promise.allSettled(notifyPromises);

    // 🗑️ 清除 Extension storage
    await StorageService.clear();
    chrome.action.setIcon({ path: chrome.runtime.getURL('icon-34-gray.png') });

    logger.log('✅ Logout completed');
  }

  static userLoggedOut: ActionHandler<'userLoggedOut', BaseResponse> = async (_message, sendResponse) => {
    try {
      await AuthFeature.performLogout('user_website_logout');
      sendResponse({ success: true });
    } catch (error) {
      logger.error('❌ Failed to logout:', error instanceof Error ? error.message : String(error));
      sendResponse({ success: false, error: 'logout failed' });
    }
  };

  static requestLogout: ActionHandler<'requestLogout', MessageResponse> = async (message, sendResponse) => {
    try {
      const reason = message.reason || 'extension_logout';
      await AuthFeature.performLogout(reason);
      sendResponse({ success: true, message: 'logout request sent to all tabs' });
    } catch (error) {
      logger.error('❌ Failed to process logout request:', error instanceof Error ? error.message : String(error));
      sendResponse({ success: false, message: 'logout request failed' });
    }
  };

  static updateIcon: ActionHandler<'updateIcon', IconUpdateResponse> = async (_message, sendResponse) => {
    const userLoggedIn = await StorageService.getUserLoginStatus();
    const iconPath = userLoggedIn ? chrome.runtime.getURL('icon-34.png') : chrome.runtime.getURL('icon-34-gray.png');
    chrome.action.setIcon({ path: iconPath });
    sendResponse({ success: true });
  };

  static async initializeIcon(): Promise<void> {
    const userLoggedIn = await StorageService.getUserLoginStatus();
    const iconPath = userLoggedIn ? chrome.runtime.getURL('icon-34.png') : chrome.runtime.getURL('icon-34-gray.png');
    chrome.action.setIcon({ path: iconPath });
  }
}
