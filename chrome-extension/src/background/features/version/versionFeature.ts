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
   */
  private static async notifyAllTabsLogout(mismatchInfo: VersionMismatchInfo): Promise<void> {
    try {
      // 取得所有符合後台域名的 tabs
      const tabs = await chrome.tabs.query({
        url: ['https://linxly-nextjs.vercel.app/*', 'http://localhost:3000/*'],
      });

      logger.log(`[VersionFeature] Notifying ${tabs.length} tabs about version mismatch`);

      // 向每個 tab 發送訊息
      const promises = tabs.map(async tab => {
        if (tab.id === undefined) return;

        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'versionMismatchLogout',
            data: {
              currentVersion: mismatchInfo.currentVersion,
              requiredVersion: mismatchInfo.requiredVersion,
            },
          });
        } catch (error) {
          // 某些 tab 可能無法接收訊息（例如尚未載入 content script）
          logger.warn(
            `[VersionFeature] Failed to notify tab ${tab.id}:`,
            error instanceof Error ? error.message : String(error),
          );
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      logger.error(
        '[VersionFeature] notifyAllTabsLogout error:',
        error instanceof Error ? error.message : String(error),
      );
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
