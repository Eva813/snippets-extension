import { getDeepActiveElement } from './textInserter';
import { parseHtmlToText } from './utils/utils';
import { insertContent } from './services/insertionService';

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
  chrome.storage.local.get(['cursorPosition', 'shortcutInfo'], async storageResult => {
    const activeElement = getDeepActiveElement();
    const cleanPrompt = parseHtmlToText(message.prompt);

    console.log('messageHandler processing:', {
      prompt: message.prompt,
      cleanPrompt,
      shortcutInfo: storageResult.shortcutInfo,
      savedCursorPosition: storageResult.cursorPosition,
      activeElement: activeElement?.tagName,
    });

    if (!activeElement) {
      console.warn('無聚焦元素，無法插入');
      sendResponse({ success: false });
      return;
    }

    // 優先順序處理邏輯：
    // 1. shortcutInfo：快捷鍵觸發的表單提交，需要替換快捷鍵文字
    // 2. 側邊面板插入：使用當前游標位置，完全忽略任何保存的位置
    let positionInfo: { start: number; end: number } | undefined = undefined;

    if (storageResult.shortcutInfo?.position) {
      // 快捷鍵觸發的表單提交：需要替換快捷鍵文字
      positionInfo = storageResult.shortcutInfo.position;
      console.log('使用 shortcutInfo 位置來替換快捷鍵文字:', positionInfo);
    } else {
      // 側邊面板直接插入：使用當前游標位置，完全忽略保存的位置
      console.log('側邊面板插入：使用當前游標位置，完全忽略任何保存的位置資訊');
      positionInfo = undefined;
    }

    console.log('Final position info:', positionInfo);

    // 使用統一的插入服務
    const insertResult = await insertContent({
      content: message.prompt,
      targetElement: activeElement as HTMLElement,
      position: positionInfo,
      saveCursorPosition: true,
    });

    // 只在使用快捷鍵插入時清除 shortcutInfo
    if (storageResult.shortcutInfo) {
      chrome.storage.local.remove('shortcutInfo');
    }

    sendResponse({ success: insertResult.success, error: insertResult.error });
  });

  return true;
});
