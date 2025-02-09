import 'webextension-polyfill';
chrome.runtime.onInstalled.addListener(() => {
  // 設定當點擊擴充功能圖示時自動開啟側邊欄
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(error => console.error(error));
});
console.log('background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");
