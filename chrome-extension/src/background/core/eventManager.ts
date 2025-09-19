import { openLoginPage } from '../config/api';

export class EventManager {
  setupExtensionControls(): void {
    // 監聽 extension icon 點擊事件
    chrome.action.onClicked.addListener(async tab => {
      const { userLoggedIn } = await chrome.storage.local.get('userLoggedIn');
      if (!userLoggedIn) {
        await openLoginPage();
        return;
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

  init(): void {
    this.setupExtensionControls();
    this.setupContextMenu();
  }
}
