import { openLoginPage } from '../config/api';
import { StorageService } from '../services/storageService';
import { logger } from '../../../../packages/shared/lib/logging/logger';
import { VersionService } from '../services/versionService';
import { VersionFeature } from '../features/version/versionFeature';

export class EventManager {
  setupExtensionControls(): void {
    // 監聽 extension icon 點擊事件
    chrome.action.onClicked.addListener(async tab => {
      logger.log('═══════════════════════════════════════');
      logger.log('🎯 [EVENT] Extension icon clicked');
      logger.log('   Tab ID:', tab.id);
      logger.log('   Tab URL:', tab.url);
      logger.log('═══════════════════════════════════════');

      let { userLoggedIn } = await chrome.storage.local.get('userLoggedIn');
      logger.log('👤 [CHECK] User logged in:', userLoggedIn);

      // 🆕 如果首次檢查儲存為空，等待 1 秒後重試一次
      // 這給 Content Script 時間完成初始化
      if (!userLoggedIn) {
        logger.log('⏳ Storage empty, retrying after 1 second...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const retry = await chrome.storage.local.get('userLoggedIn');
        userLoggedIn = retry.userLoggedIn;
        logger.log('🔄 [RETRY] Result:', userLoggedIn);
      }

      if (!userLoggedIn) {
        logger.log('🔴 User not logged in, opening login page');
        await openLoginPage();
        return;
      }

      // 已登入時檢查版本相容性
      const apiDomain = await StorageService.getApiDomain();
      logger.log('🌐 [CHECK] API domain:', apiDomain);

      if (apiDomain) {
        logger.log('📡 [ACTION] Checking version compatibility...');
        const extensionVersion = chrome.runtime.getManifest().version;
        const mismatchInfo = await VersionService.checkAndGetMismatchInfo();

        logger.log(`📦 Extension version: ${extensionVersion}`);
        logger.log(`📦 Mismatch info exists:`, mismatchInfo !== null);

        if (mismatchInfo) {
          const versionMismatch = extensionVersion !== mismatchInfo.requiredVersion;

          logger.log(`⚠️ [MISMATCH] Version mismatch: ${versionMismatch}`);

          logger.warn('⚠️ Version mismatch/incompatible on icon click, clearing auth state');

          // 1. 先使用 VersionFeature 通知 tabs 和後端登出（需要在清除 storage 前執行）
          // (這時 storage 仍有效，可以取得 apiDomain)
          try {
            await VersionFeature.handleVersionMismatch(mismatchInfo);
          } catch (err) {
            logger.warn('[EventManager] VersionFeature.handleVersionMismatch failed:', String(err));
          }

          // 2. 清除 Extension storage（觸發 storage.onChanged，通知 content script 登出）
          await StorageService.clear();

          // 3. 更新圖示為灰色並加上警告徽章
          await chrome.action.setIcon({ path: chrome.runtime.getURL('icon-34-gray.png') });
          await chrome.action.setBadgeText({ text: '!' });
          await chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });

          // 4. 僅在沒有後台 tab 開啟時才自動開啟登入頁
          // (如果有後台 tab，versionFeature 已經通知該 tab 進行登出)
          const tabs = await chrome.tabs.query({
            url: ['https://linxly-nextjs.vercel.app/*', 'http://localhost:3000/*'],
          });

          if (tabs.length === 0) {
            logger.log('[EventManager] No backend tabs open, opening login page');
            await openLoginPage();
          } else {
            logger.log(`[EventManager] ${tabs.length} backend tabs found, letting them handle redirect`);
          }

          return;
        }
      } else {
        logger.log('⚠️ No API domain found, skipping version check');
      }

      // 版本檢查通過或未進行，執行正常流程
      logger.log('✅ Version check passed, opening side panel for tab:', tab.id);

      // 發送訊息給 Content Script 打開 Side Panel
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'toggleSlidePanel' }, () => {
          if (chrome.runtime.lastError) {
            logger.error('❌ Failed to send toggleSlidePanel:', chrome.runtime.lastError.message);
          } else {
            logger.log('✅ toggleSlidePanel message sent successfully');
          }
        });
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
