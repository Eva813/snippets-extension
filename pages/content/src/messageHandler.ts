import { insertTextAtCursor, getDeepActiveElement } from './textInserter';
import { parseHtmlToText, generateElementPath } from './utils/utils';

// 負責收集和準備位置資訊
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
    const cleanPrompt = parseHtmlToText(message.prompt);

    console.log('messageHandler processing:', {
      prompt: message.prompt,
      cleanPrompt,
      shortcutInfo: result.shortcutInfo,
      savedCursorPosition: result.savedCursorPosition,
      activeElement: activeElement?.tagName,
    });

    if (!activeElement) {
      console.warn('無聚焦元素，無法插入');
      sendResponse({ success: false });
      return;
    }

    // 優先順序: shortcutInfo > 已保存的游標位置 > 當前游標位置
    let positionInfo = result.shortcutInfo?.position;
    const savedCursorPosition = result.cursorPosition;

    // 對於 shortcutInfo，我們需要保留位置資訊來替換快捷鍵文字
    if (positionInfo) {
      console.log('使用 shortcutInfo 位置來替換快捷鍵文字:', positionInfo);
    }

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

    console.log('Final position info:', positionInfo);

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
