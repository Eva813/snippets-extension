// messageHandler.ts
import { insertTextAtCursor, getDeepActiveElement } from './textInserter';
import { stripHtml } from './utils/utils';
import { findTextRangeNodes } from '@src/utils/findTextRangeNodes';
import { insertIntoRange } from '@src/utils/insertIntoRange';

// 當 popup 提交表單時，background 會發送訊息給 content script 進行插入
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

  chrome.storage.local.get('shortcutInfo', async result => {
    const activeElement = getDeepActiveElement();
    const cleanPrompt = stripHtml(message.prompt);
    const originalPrompt = message.prompt;

    if (!activeElement) {
      console.warn('無聚焦元素，無法插入');
      sendResponse({ success: false });
      return;
    }

    const shortcutInfo = result.shortcutInfo;

    // 處理文字輸入框
    if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
      const { start, end } = shortcutInfo?.position ?? { start: 0, end: 0 };
      const originalValue = activeElement.value;

      // 插入新的文字，取代 shortcut 區段
      const updatedValue = originalValue.slice(0, start) + cleanPrompt + originalValue.slice(end);
      activeElement.value = updatedValue;

      // 移動游標至插入文字結尾
      const cursorPosition = start + cleanPrompt.length;
      activeElement.setSelectionRange(cursorPosition, cursorPosition);

      // 觸發事件，確保變更被偵測（例如 React 或其他框架）
      const inputEvent = new Event('input', { bubbles: true });
      const changeEvent = new Event('change', { bubbles: true });
      activeElement.dispatchEvent(inputEvent);
      activeElement.dispatchEvent(changeEvent);

      // 清除 shortcut 資訊
      // chrome.storage.local.remove('shortcutInfo');

      sendResponse({ success: true });
      return;
    }

    // 處理 contenteditable
    if (activeElement instanceof HTMLElement && activeElement.isContentEditable) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        await insertTextAtCursor(cleanPrompt);
        sendResponse({ success: true });
        return;
      }

      try {
        const { start, end } = shortcutInfo?.position || { start: 0, end: 0 };
        const { startNode, endNode, startOffset, endOffset } = findTextRangeNodes(activeElement, start, end);

        if (startNode && endNode) {
          const range = document.createRange();
          range.setStart(startNode, startOffset);
          range.setEnd(endNode, endOffset);
          insertIntoRange(range, cleanPrompt, originalPrompt);
        } else {
          console.warn('找不到對應範圍，改用 insertTextAtCursor');
          const positionInfo = shortcutInfo?.position || null;
          await insertTextAtCursor(cleanPrompt, positionInfo);
        }
      } catch (error) {
        console.error('處理 contenteditable 插入失敗：', error);
        await insertTextAtCursor(cleanPrompt);
      }

      chrome.storage.local.remove('shortcutInfo');
      sendResponse({ success: true });
      return;
    }

    // 若無 shortcut info 或不支援元素
    console.log('沒有 shortcut 資訊或元素類型不符，使用 sidepanel 插入');
    // const success = await insertTextAtCursor(cleanPrompt);
    const positionInfo = shortcutInfo?.position || null;
    const success = await insertTextAtCursor(cleanPrompt, positionInfo);
    sendResponse({ success });
  });

  return true;
});
