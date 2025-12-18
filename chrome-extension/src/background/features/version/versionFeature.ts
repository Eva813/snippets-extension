import { VersionService } from '../../services/versionService';
import { NotificationService } from '../../services/notificationService';
import { logger } from '../../../../../packages/shared/lib/logging/logger';
import type { ActionHandler } from '../../types/utils';
import type { VersionCheckResponse, BaseResponse } from '../../types/responses';
import type { VersionMismatchInfo } from '../../types/version';

/**
 * 版本檢查功能模組
 * 處理 Extension 版本檢查與版本不符的相關邏輯
 */
export class VersionFeature {
  /**
   * 檢查 Extension 版本
   * 由 MessageRouter 呼叫
   */
  static checkExtensionVersion: ActionHandler<'checkExtensionVersion', VersionCheckResponse> = async (
    _message,
    sendResponse,
  ) => {
    try {
      const mismatchInfo = await VersionService.checkAndGetMismatchInfo();

      if (!mismatchInfo) {
        // 版本一致或檢查失敗
        sendResponse({
          success: true,
          versionMatched: true,
          extensionVersion: VersionService.getExtensionVersion(),
        });
        return;
      }

      // 版本不符：處理登出流程
      await VersionFeature.handleVersionMismatch(mismatchInfo);

      sendResponse({
        success: true,
        versionMatched: false,
        extensionVersion: mismatchInfo.currentVersion,
        requiredVersion: mismatchInfo.requiredVersion,
        updateUrl: mismatchInfo.updateUrl,
        message: mismatchInfo.message,
      });
    } catch (error) {
      logger.error(
        '[VersionFeature] checkExtensionVersion error:',
        error instanceof Error ? error.message : String(error),
      );
      sendResponse({
        success: false,
        error: 'Failed to check extension version',
      });
    }
  };

  /**
   * 通知 Content Script 版本不符
   * 由 MessageRouter 呼叫
   */
  static notifyVersionMismatch: ActionHandler<'notifyVersionMismatch', BaseResponse> = async (
    message,
    sendResponse,
  ) => {
    const { versionInfo } = message;

    try {
      await VersionFeature.handleVersionMismatch(versionInfo);
      sendResponse({ success: true });
    } catch (error) {
      logger.error(
        '[VersionFeature] notifyVersionMismatch error:',
        error instanceof Error ? error.message : String(error),
      );
      sendResponse({
        success: false,
        error: 'Failed to notify version mismatch',
      });
    }
  };

  /**
   * 處理版本不符的核心邏輯
   * @param mismatchInfo 版本不符資訊
   */
  static async handleVersionMismatch(mismatchInfo: VersionMismatchInfo): Promise<void> {
    logger.warn(
      '[VersionFeature] Version mismatch detected:',
      `current=${mismatchInfo.currentVersion}, required=${mismatchInfo.requiredVersion}`,
    );

    // 1. 通知所有開啟的後台網頁登出
    await VersionFeature.notifyAllTabsLogout(mismatchInfo);

    // 2. 顯示 Chrome 通知
    await VersionFeature.showUpdateNotification(mismatchInfo);
  }

  /**
   * 通知所有符合條件的 Tab 登出
   * 如果沒有後台 tab 開啟，或所有通知都失敗，則直接呼叫 API 登出以確保狀態同步
   */
  private static async notifyAllTabsLogout(mismatchInfo: VersionMismatchInfo): Promise<void> {
    try {
      // 取得所有符合後台域名的 tabs
      const tabs = await chrome.tabs.query({
        url: ['https://linxly-nextjs.vercel.app/*', 'http://localhost:3000/*'],
      });

      if (tabs.length === 0) {
        // 沒有後台 tab 開啟 → 直接呼叫後端登出 API
        logger.log('[VersionFeature] No backend tabs open, calling logout API directly');
        await this.logoutViaAPI();
        return;
      }

      // 有後台 tab → 向每個 tab 發送訊息
      logger.log(`[VersionFeature] Notifying ${tabs.length} tabs about version mismatch`);

      let successCount = 0;
      const promises = tabs.map(async tab => {
        if (tab.id === undefined) return false;

        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'versionMismatchLogout',
            data: {
              currentVersion: mismatchInfo.currentVersion,
              requiredVersion: mismatchInfo.requiredVersion,
            },
          });
          return true;
        } catch (error) {
          // 某些 tab 可能無法接收訊息（例如尚未載入 content script）
          logger.warn(
            `[VersionFeature] Failed to notify tab ${tab.id}:`,
            error instanceof Error ? error.message : String(error),
          );
          return false;
        }
      });

      const results = await Promise.allSettled(promises);
      successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;

      logger.log(`[VersionFeature] Tab notification results: ${successCount}/${tabs.length} succeeded`);

      // 如果沒有任何 tab 成功接收訊息，呼叫後端登出 API 作為備案
      if (successCount === 0) {
        logger.log('[VersionFeature] All tab notifications failed, calling logout API as fallback');
        await this.logoutViaAPI();
      }
    } catch (error) {
      logger.error(
        '[VersionFeature] notifyAllTabsLogout error:',
        error instanceof Error ? error.message : String(error),
      );
      // 若 tabs.query 本身失敗，也嘗試後端登出以確保用戶被登出
      logger.log('[VersionFeature] Attempting fallback logout due to tabs.query error');
      await this.logoutViaAPI();
    }
  }

  /**
   * 透過後端 Extension 專用登出 API 進行登出（當沒有後台 tab 可通知時使用）
   * 使用 Extension 專用的 `/api/v1/extension/logout` endpoint
   * 該 API 會清除 NextAuth session 並回傳 clearExtensionStorage 旗標
   */
  private static async logoutViaAPI(): Promise<void> {
    try {
      const { StorageService } = await import('../../services/storageService');
      const apiDomain = await StorageService.getApiDomain();

      if (!apiDomain) {
        logger.warn('[VersionFeature] No API domain found, skipping backend logout');
        return;
      }

      // 🆕 使用 Extension 專用的登出 API
      const response = await fetch(`${apiDomain}/api/v1/extension/logout`, {
        method: 'POST',
        credentials: 'include', // 重要：攜帶 session cookie
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': import.meta.env.VITE_VERCEL_PREVIEW_BYPASS || '',
        },
      });

      if (response.ok) {
        const data = (await response.json()) as { clearExtensionStorage?: boolean };

        logger.log('[VersionFeature] Backend logout successful via Extension API');

        // 根據 API 回應清除 Extension storage
        if (data.clearExtensionStorage) {
          await StorageService.clear();
          logger.log('[VersionFeature] Extension storage cleared by API response');
        }

        // 登出完成後，刷新所有後台 tab 以強制重新檢查認證狀態
        try {
          const tabs = await chrome.tabs.query({
            url: ['https://linxly-nextjs.vercel.app/*', 'http://localhost:3000/*'],
          });

          tabs.forEach(tab => {
            if (tab.id !== undefined) {
              chrome.tabs.reload(tab.id);
            }
          });

          if (tabs.length > 0) {
            logger.log(`[VersionFeature] Refreshed ${tabs.length} backend tabs after logout`);
          }
        } catch (refreshError) {
          logger.warn(
            '[VersionFeature] Failed to refresh tabs:',
            refreshError instanceof Error ? refreshError.message : String(refreshError),
          );
        }
      } else {
        logger.warn('[VersionFeature] Backend logout failed:', response.status);
        // 即使 API 失敗，也要清除 Extension storage 以確保安全
        await StorageService.clear();
        logger.warn('[VersionFeature] Extension storage cleared due to API failure');
      }
    } catch (error) {
      logger.error('[VersionFeature] Logout API error:', error instanceof Error ? error.message : String(error));
      // 錯誤處理：即使 API 呼叫失敗，也要清除 Extension storage
      try {
        const { StorageService } = await import('../../services/storageService');
        await StorageService.clear();
        logger.warn('[VersionFeature] Extension storage cleared due to API error');
      } catch (storageError) {
        logger.error(
          '[VersionFeature] Failed to clear storage on error:',
          storageError instanceof Error ? storageError.message : String(storageError),
        );
      }
    }
  }

  /**
   * 顯示更新通知
   */
  private static async showUpdateNotification(mismatchInfo: VersionMismatchInfo): Promise<void> {
    try {
      const notificationId = await NotificationService.create({
        type: 'basic',
        iconUrl: 'icon-34.png',
        title: '⚠️ PromptBear Extension 需要更新',
        message: `目前版本 ${mismatchInfo.currentVersion} 已過期\n請更新至 ${mismatchInfo.requiredVersion} 並重新登入`,
      });

      logger.log('[VersionFeature] Update notification created:', notificationId);

      // 監聽通知點擊事件
      const clickListener = (clickedNotificationId: string) => {
        if (clickedNotificationId === notificationId) {
          // 開啟更新頁面
          chrome.tabs.create({ url: mismatchInfo.updateUrl });
          chrome.notifications.onClicked.removeListener(clickListener);
        }
      };

      chrome.notifications.onClicked.addListener(clickListener);
    } catch (error) {
      logger.error(
        '[VersionFeature] showUpdateNotification error:',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
