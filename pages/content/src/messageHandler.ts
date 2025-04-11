import { insertTextAtCursor, getDeepActiveElement } from './textInserter';
import { stripHtml, generateElementPath } from './utils/utils';

// 負責收集和準備位置資訊
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('收到訊息 插入:', message);
  if (message.action !== 'insertPrompt') {
    sendResponse({ success: false, error: 'Unknown action' });
    return false;
  }

  if (!message.prompt) {
    sendResponse({ success: false, error: 'Invalid prompt data' });
    return false;
  }

  // 先嘗試獲取已保存的游標位置
  chrome.storage.local.get(['cursorPosition', 'shortcutInfo'], async result => {
    const activeElement = getDeepActiveElement();
    const cleanPrompt = stripHtml(message.prompt);
    // const originalPrompt = message.prompt;

    if (!activeElement) {
      console.warn('無聚焦元素，無法插入');
      sendResponse({ success: false });
      return;
    }

    // 優先順序: shortcutInfo > 已保存的游標位置 > 當前游標位置
    let positionInfo = result.shortcutInfo?.position;
    const savedCursorPosition = result.cursorPosition;

    if (!positionInfo && savedCursorPosition) {
      // 驗證元素是否與保存時相同
      const currentPath = generateElementPath(activeElement);
      if (currentPath === savedCursorPosition.elementPath) {
        positionInfo = {
          start: savedCursorPosition.start,
          end: savedCursorPosition.end,
        };
      }
    }

    // 使用確定的位置資訊進行插入
    const success = await insertTextAtCursor(cleanPrompt, positionInfo);

    // 只在使用快捷鍵插入時清除 shortcutInfo
    if (result.shortcutInfo) {
      chrome.storage.local.remove('shortcutInfo');
    }

    sendResponse({ success });
  });

  return true;
});
