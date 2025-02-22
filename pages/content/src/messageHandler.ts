// messageHandler.ts
import { insertTextAtCursor, getDeepActiveElement } from './textInserter';
import { stripHtml } from './utils';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'insertPrompt') {
    if (!message.prompt) {
      sendResponse({ success: false, error: 'Invalid prompt data' });
      return false;
    }

    // Get stored shortcut info
    chrome.storage.local.get('shortcutInfo', async result => {
      const cleanPrompt = stripHtml(message.prompt);
      const element = getDeepActiveElement();

      if (element && result.shortcutInfo) {
        console.log('Shortcut info:', result.shortcutInfo);
        // Remove the shortcut text first
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          const currentValue = element.value;
          const { start, end } = result.shortcutInfo.position;
          // Remove shortcut and insert new content
          element.value = currentValue.slice(0, start) + cleanPrompt + currentValue.slice(end);
          // Move cursor to end of inserted content
          const newPosition = start + cleanPrompt.length;
          element.setSelectionRange(newPosition, newPosition);
          // Dispatch events
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (element instanceof HTMLElement && element.isContentEditable) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            // Remove shortcut
            range.setStart(range.startContainer, result.shortcutInfo.position.start);
            range.setEnd(range.startContainer, result.shortcutInfo.position.end);
            range.deleteContents();
            // Insert new content
            const textNode = document.createTextNode(cleanPrompt);
            range.insertNode(textNode);
            // Move cursor to end
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
        // Clean up stored shortcut info
        chrome.storage.local.remove('shortcutInfo');
        sendResponse({ success: true });
      } else {
        // Fallback to normal insertion if no shortcut info
        const success = await insertTextAtCursor(cleanPrompt);
        sendResponse({ success });
      }
    });
    return true;
  }
  sendResponse({ success: false, error: 'Unknown action' });
  return false;
});
