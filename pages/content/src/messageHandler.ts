import { getDeepActiveElement } from './utils/getDeepActiveElement';
import { insertContent } from './services/insertionService';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // 使用醒目的樣式記錄調試信息
  console.log(
    '%c🚀 CONTENT SCRIPT: Message Received',
    'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;',
    {
      action: message.action,
      hasPrompt: !!message.prompt,
      hasPromptJSON: !!message.promptJSON,
      promptJSONType: typeof message.promptJSON,
      promptLength: message.prompt?.length || 0,
      promptPreview: message.prompt?.slice(0, 100),
      title: message.title,
    },
  );

  // 特別記錄表單提交的情況
  if (message.prompt && message.prompt.length > 0) {
    console.log(
      '%c📄 CONTENT: Form Submission Data Received',
      'background: #FF9800; color: white; padding: 2px 5px; border-radius: 3px;',
      {
        contentLength: message.prompt.length,
        contentPreview: message.prompt.slice(0, 200),
        fullContent: message.prompt,
      },
    );
  }

  if (message.action !== 'insertPrompt') {
    sendResponse({ success: false, error: 'Unknown action' });
    return false;
  }

  if (!message.prompt && !message.promptJSON) {
    console.log('❌ Content: No prompt data available');
    sendResponse({ success: false, error: 'Invalid prompt data' });
    return false;
  }

  // 先嘗試獲取已保存的游標位置
  chrome.storage.local.get(['cursorPosition', 'shortcutInfo'], async storageResult => {
    const activeElement = getDeepActiveElement();

    if (!activeElement) {
      console.warn('無聚焦元素，無法插入');
      sendResponse({ success: false });
      return;
    }

    // 優先順序處理邏輯：
    // 1. shortcutInfo：快捷鍵觸發的表單提交(有含 data-prompt)，需要替換快捷鍵文字
    // 2. 側邊面板插入：使用當前游標位置，完全忽略任何保存的位置
    let positionInfo: { start: number; end: number } | undefined = undefined;

    if (storageResult.shortcutInfo?.position) {
      // 快捷鍵觸發的表單提交(有含 data-prompt)：需要替換快捷鍵文字
      positionInfo = storageResult.shortcutInfo.position;
    } else {
      // 側邊面板直接插入：使用當前游標位置，完全忽略保存的位置
      positionInfo = undefined;
    }

    console.log(
      '%c🎯 CONTENT: Calling insertContent',
      'background: #2196F3; color: white; padding: 2px 5px; border-radius: 3px;',
      {
        hasContent: !!message.prompt,
        hasContentJSON: !!message.promptJSON,
        targetElement: activeElement?.tagName,
        positionInfo,
        contentLength: message.prompt?.length || 0,
      },
    );

    const insertResult = await insertContent({
      content: message.prompt,
      contentJSON: message.promptJSON,
      targetElement: activeElement as HTMLElement,
      position: positionInfo,
      saveCursorPosition: true,
    });

    console.log(
      '%c📤 CONTENT: Insert Result',
      'background: #9C27B0; color: white; padding: 2px 5px; border-radius: 3px;',
      {
        success: insertResult.success,
        error: insertResult.error,
        hasResult: !!insertResult,
        resultDetails: insertResult,
      },
    );

    // 只在使用快捷鍵插入時清除 shortcutInfo
    if (storageResult.shortcutInfo) {
      chrome.storage.local.remove('shortcutInfo');
    }

    sendResponse({ success: insertResult.success, error: insertResult.error });
  });

  return true;
});
