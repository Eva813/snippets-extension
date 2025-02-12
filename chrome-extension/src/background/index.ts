import 'webextension-polyfill';
chrome.runtime.onInstalled.addListener(() => {
  // 設定當點擊擴充功能圖示時自動開啟側邊欄
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(error => console.error(error));
});

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === 'openExtraPopup') {
//     chrome.windows.create({
//       url: chrome.runtime.getURL('extraPopup.html'),
//       type: 'popup',
//       width: 600,
//       height: 800
//     }, (newWindow) => {
//       if (newWindow) {
//         sendResponse({ success: true, windowId: newWindow.id });
//       } else {
//         sendResponse({ success: false });
//       }
//     });
//     // 必須 return true 表示非同步回應
//     return true;
//   }
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'createWindow') {
    chrome.windows.create(
      {
        url: chrome.runtime.getURL('formLoader.html'),
        type: 'popup',
        width: 600,
        height: 400,
      },
      function (window) {
        if (chrome.runtime.lastError) {
          console.error('Error creating window:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError });
        } else {
          console.log('New window created', window);
          sendResponse({ success: true });
        }
      },
    );
    // 必須返回 true，以指示將會有異步回應
    return true;
  }
});

console.log('background loaded');
