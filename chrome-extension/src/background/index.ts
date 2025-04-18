/* eslint-disable @typescript-eslint/no-explicit-any */
import 'webextension-polyfill';

// chrome.runtime.onInstalled.addListener(() => {
//   // 設定當點擊擴充功能圖示時自動開啟側邊欄
//   chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(error => console.error(error));
// });

// 定義類型
interface PopupData {
  title: string;
  content: any; // 建議使用更明確的類型而非 any
}

interface SnippetData {
  content: string;
  shortcut: string;
  name: string;
}

// 全域狀態（考慮改用更好的狀態管理方式）
let popupData: PopupData | null = null;
let targetTabId: number | null | undefined = null;

// 監聽 extension icon 點擊事件
// 擴充功能圖示與快捷鍵處理
function setupExtensionControls() {
  // 監聽 extension icon 點擊事件
  chrome.action.onClicked.addListener(tab => {
    console.log('Extension icon clicked:', tab);
    if (tab.id !== undefined) {
      chrome.tabs.sendMessage(tab.id, { action: 'toggleSlidePanel' });
    }
  });

  // 監聽快捷鍵事件
  chrome.commands.onCommand.addListener(async command => {
    console.log('Command received:', command);
    if (command === 'toggle_side_panel') {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id !== undefined) {
        chrome.tabs.sendMessage(tab.id, { action: 'toggleSlidePanel' });
      }
    }
  });

  // 處理開啟快捷鍵設定頁面
  chrome.runtime.onMessage.addListener(message => {
    if (message.action === 'openShortcutsPage') {
      chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    }
  });
}

// Popup 視窗相關處理
function setupPopupHandling() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 建立 popup 視窗
    if (message.action === 'createWindow') {
      handleCreatePopupWindow(message, sendResponse);
      return true;
    }

    // Popup 請求資料
    if (message.action === 'getPopupData') {
      sendResponse({ data: popupData });
      return true;
    }

    // Popup 表單提交
    if (message.action === 'submitForm') {
      handleFormSubmission(message, sendResponse);
      return true;
    }

    return false;
  });
}

// 側邊欄相關處理
function setupSidePanelHandling() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'sidePanelInsertPrompt') {
      handleSidePanelInsert(message, sendResponse);
      return true;
    }
    return false;
  });
}

// PopupWindow
function handleCreatePopupWindow(message: any, sendResponse: (response?: any) => void) {
  popupData = {
    title: message.title,
    content: message.content,
  };

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs?.[0]?.id) {
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
}

function handleFormSubmission(message: any, sendResponse: (response?: any) => void) {
  console.log('Form submission received:', message.finalOutput);

  if (!targetTabId) {
    console.error('No target tab id stored');
    sendResponse({ success: false, error: 'No target tab id stored' });
    return;
  }

  chrome.tabs.sendMessage(targetTabId, { action: 'insertPrompt', prompt: message.finalOutput }, response => {
    if (chrome.runtime.lastError) {
      console.error('Message send error:', chrome.runtime.lastError);
      sendResponse({ success: false, error: chrome.runtime.lastError.message });
      return;
    }

    console.log('Insertion response:', response);
    sendResponse({ success: true, response });
  });
}

function handleSidePanelInsert(message: any, sendResponse: (response?: any) => void) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs || !tabs[0]?.id) {
      console.warn('No active tab found.');
      sendResponse({ success: false, error: 'No active tab found.' });
      return;
    }

    const { content, shortcut, name } = message.snippet as SnippetData;
    const title = `${shortcut} - ${name}`;

    chrome.tabs.sendMessage(tabs[0].id, { action: 'insertPrompt', prompt: content, title }, response => {
      sendResponse({ success: true, response });
    });
  });
}

// 初始化
function initialize() {
  setupExtensionControls();
  setupPopupHandling();
  setupSidePanelHandling();
  console.log('Background script initialized');
}

initialize();
