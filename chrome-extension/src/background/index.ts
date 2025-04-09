/* eslint-disable @typescript-eslint/no-explicit-any */
import 'webextension-polyfill';

chrome.runtime.onInstalled.addListener(() => {
  // 設定當點擊擴充功能圖示時自動開啟側邊欄
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(error => console.error(error));
});

let popupData: { title: string; content: any } | null = null;
let targetTabId: number | null | undefined = null; // 用來儲存原本有 content script 注入的 tab id
// 創建 popup 前儲存原本的目標頁籤 ID，並在提交表單時使用該 ID 發送訊息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Side-panel 傳送過來建立 popup 的訊息
  if (message.action === 'createWindow') {
    popupData = {
      title: message.title,
      content: message.content,
    };
    // 在建立 popup 之前先儲存當前活動 tab 的 id
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs && tabs.length > 0) {
        targetTabId = tabs[0].id;
        console.log('Stored target tab id:', targetTabId);
      }
      chrome.windows.create(
        {
          url: chrome.runtime.getURL('side-panel/formLoader.html'),
          type: 'popup',
          width: 500,
          height: 400,
        },
        newWindow => {
          console.log('Popup window created:', newWindow);
          sendResponse({ success: true });
        },
      );
    });
    return true;
  }

  // Popup 啟動後向背景索取先前暫存的資料
  if (message.action === 'getPopupData') {
    sendResponse({ data: popupData });
    return true;
  }

  // Popup 表單提交後，背景收到訊息，將資料傳給原本有 content script 的 tab 進行插入
  if (message.action === 'submitForm') {
    console.log('Form submission received:', message.finalOutput);
    if (targetTabId) {
      chrome.tabs.sendMessage(targetTabId, { action: 'insertPrompt', prompt: message.finalOutput }, response => {
        if (chrome.runtime.lastError) {
          console.error('Message send error:', chrome.runtime.lastError);
        } else {
          console.log('Insertion response:', response);
        }
        console.log('Sending response to popup:', response);
        sendResponse({ success: true, response });
      });
    } else {
      console.error('No target tab id stored');
      sendResponse({ success: false, error: 'No target tab id stored' });
    }
    return true;
  }
});

//console.log('background loaded');
