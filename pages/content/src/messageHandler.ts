// messageHandler.ts
import { insertTextAtCursor } from './textInserter';
import { stripHtml } from './utils';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'insertPrompt') {
    console.log('Received insertPrompt message:', message);

    if (!message.prompt) {
      sendResponse({ success: false, error: 'Invalid prompt data' });
      return false;
    }
    const cleanPrompt = stripHtml(message.prompt);
    insertTextAtCursor(cleanPrompt)
      .then(success => sendResponse({ success }))
      .catch(error => {
        console.error('Error inserting text:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  return false;
});
