import { StateManager } from '../../core/stateManager';
import type { ActionHandler } from '../../types/utils';
import type { UIOperationResponse, PopupDataResponse, MessageResponse, BaseResponse } from '../../types/responses';

export class UIFeature {
  static createWindow: ActionHandler<'createWindow', UIOperationResponse> = async (message, sendResponse) => {
    const { title, content, contentJSON } = message;

    const popupData = {
      title,
      content,
      contentJSON,
    };

    StateManager.setPopupData(popupData);

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs?.[0]?.id) {
        StateManager.setTargetTabId(tabs[0].id);
      }

      chrome.windows.create(
        {
          url: chrome.runtime.getURL('side-panel/formLoader.html'),
          type: 'popup',
          width: 500,
          height: 400,
        },
        () => {
          sendResponse({ success: true });
        },
      );
    });
  };

  static getPopupData: ActionHandler<'getPopupData', PopupDataResponse> = async (_message, sendResponse) => {
    const data = StateManager.getPopupData();
    sendResponse({ data });
  };

  static submitForm: ActionHandler<'submitForm', MessageResponse> = async (message, sendResponse) => {
    const { finalOutput } = message;

    const targetTabId = StateManager.getTargetTabId();
    if (!targetTabId) {
      sendResponse({ success: false, error: 'No target tab id stored' });
      return;
    }

    chrome.tabs.sendMessage(
      targetTabId,
      {
        action: 'insertPrompt',
        prompt: finalOutput,
        promptJSON: null, // Form submissions generate HTML, not JSON
        title: 'Form Submission Result',
      },
      response => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse({ success: true, response });
      },
    );
  };

  static openShortcutsPage: ActionHandler<'openShortcutsPage', BaseResponse> = async (_message, sendResponse) => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    sendResponse({ success: true });
  };
}
