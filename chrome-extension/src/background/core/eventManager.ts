import { openLoginPage } from '../config/api';
import { StorageService } from '../services/storageService';
import { logger } from '../../../../packages/shared/lib/logging/logger';
import { VersionService } from '../services/versionService';
import { VersionFeature } from '../features/version/versionFeature';

export class EventManager {
  setupExtensionControls(): void {
    // 監聽 extension icon 點擊事件
    chrome.action.onClicked.addListener(async tab => {
      const { userLoggedIn } = await chrome.storage.local.get('userLoggedIn');
      if (!userLoggedIn) {
        await openLoginPage();
        return;
      }

      // 已登入時檢查版本相容性
      const apiDomain = await StorageService.getApiDomain();
      if (apiDomain) {
        const extensionVersion = chrome.runtime.getManifest().version;
        const mismatchInfo = await VersionService.checkAndGetMismatchInfo();

        if (mismatchInfo) {
          const versionMismatch = extensionVersion !== mismatchInfo.requiredVersion;

          logger.log(`🔍 User Extension version: ${extensionVersion}`);
          logger.log(`🔍 Backend required version: ${mismatchInfo.requiredVersion}`);
          logger.log(`🔍 Version mismatch: ${versionMismatch}`);

          logger.warn('⚠️ Version mismatch/incompatible on icon click, clearing auth state');

          // 使用 VersionFeature 的集中處理，可靠地通知所有符合條件的 tabs
          try {
            await VersionFeature.handleVersionMismatch(mismatchInfo);
          } catch (err) {
            logger.warn('[EventManager] VersionFeature.handleVersionMismatch failed:', String(err));
          }

          // 2. 登出後端 (嘗試呼叫後端登出以清除 session，忽略錯誤)
          try {
            await fetch(`${apiDomain}/api/v1/extension/logout`, {
              method: 'POST',
              credentials: 'include',
              mode: 'cors',
            });
          } catch (err) {
            logger.warn('⚠️ Backend logout failed (ignored):', String(err));
          }

          // 3. 清除 Extension storage（觸發 storage.onChanged）
          await StorageService.clear();
          chrome.action.setIcon({ path: 'icon-34-gray.png' });

          // 4. 開啟登入頁面讓用戶看到更新提示
          await openLoginPage();
          return;
        }
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

  setupContextMenu(): void {
    // 創建 Context Menu（Chrome 會自動使用 manifest 中的 16px icon）
    chrome.contextMenus.create({
      id: 'addToPromptBear',
      title: 'Add to PromptBear',
      contexts: ['selection'],
    });
  }

  setupContextMenuHandler(handler: (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => void): void {
    // Context Menu 點擊處理
    chrome.contextMenus.onClicked.addListener(handler);
  }

  /**
   * 設置 Extension 生命週期事件監聽
   */
  setupLifecycleListeners(): void {
    // Extension 安裝/更新時檢查版本
    chrome.runtime.onInstalled.addListener(async details => {
      logger.log('[EventManager] Extension installed/updated:', details.reason);

      if (details.reason === 'install' || details.reason === 'update') {
        try {
          await chrome.runtime.sendMessage({ action: 'checkExtensionVersion' });
        } catch (error) {
          logger.error('[EventManager] Version check on install/update failed:', String(error));
        }
      }
    });

    // Extension 啟動時檢查版本
    chrome.runtime.onStartup.addListener(async () => {
      logger.log('[EventManager] Extension started');

      try {
        await chrome.runtime.sendMessage({ action: 'checkExtensionVersion' });
      } catch (error) {
        logger.error('[EventManager] Version check on startup failed:', String(error));
      }
    });
  }

  init(): void {
    this.setupExtensionControls();
    this.setupContextMenu();
    this.setupLifecycleListeners();
  }
}
