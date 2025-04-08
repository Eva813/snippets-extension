// messageHandler.ts
import { insertTextAtCursor, getDeepActiveElement } from './textInserter';
import { stripHtml } from './utils';

// 可以保留此
// chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
//   if (message.action === 'insertPrompt') {
//     if (!message.prompt) {
//       sendResponse({ success: false, error: 'Invalid prompt data' });
//       return false;
//     }

//     // Get stored shortcut info
//     chrome.storage.local.get('shortcutInfo', async result => {
//       // const cleanPrompt = stripHtml(message.prompt);
//       const element = getDeepActiveElement();
//       // 為純文字欄位使用 stripHtml
//       const cleanPrompt = stripHtml(message.prompt);
//       // 為支援 HTML 的元素保留原始 HTML
//       const originalPrompt = message.prompt;

//       if (element && result.shortcutInfo) {
//         console.log('Shortcut info:', result.shortcutInfo);
//         // Remove the shortcut text first
//         if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
//           const currentValue = element.value;
//           const { start, end } = result.shortcutInfo.position;
//           // Remove shortcut and insert new content
//           element.value = currentValue.slice(0, start) + cleanPrompt + currentValue.slice(end);
//           // Move cursor to end of inserted content
//           const newPosition = start + cleanPrompt.length;
//           element.setSelectionRange(newPosition, newPosition);
//           // Dispatch events
//           element.dispatchEvent(new Event('input', { bubbles: true }));
//           element.dispatchEvent(new Event('change', { bubbles: true }));
//         }
//         else if (element instanceof HTMLElement && element.isContentEditable) {
//           const selection = window.getSelection();
//           if (selection && selection.rangeCount > 0) {
//             try {
//               // 取得完整的文字內容和位置資訊
//               const elementContent = element.textContent || '';
//               const { start, end } = result.shortcutInfo.position;
//               console.log('要移除的 shortcut:', elementContent.substring(start, end));

//               // 找出正確的節點和位置
//               let currentNode = element.firstChild;
//               let currentOffset = 0;
//               let startNode = null;
//               let startOffset = 0;
//               let endNode = null;
//               let endOffset = 0;

//               // 遍歷所有節點尋找正確的起始和結束位置
//               while (currentNode && (!startNode || !endNode)) {
//                 // 只處理文字節點
//                 if (currentNode.nodeType === Node.TEXT_NODE) {
//                   const textLength = currentNode.textContent?.length || 0;

//                   // 找到起始節點
//                   if (!startNode && currentOffset + textLength > start) {
//                     startNode = currentNode;
//                     startOffset = start - currentOffset;
//                   }

//                   // 找到結束節點
//                   if (!endNode && currentOffset + textLength >= end) {
//                     endNode = currentNode;
//                     endOffset = end - currentOffset;
//                     break;
//                   }

//                   currentOffset += textLength;
//                 }

//                 // 檢查子節點
//                 if (currentNode.firstChild) {
//                   currentNode = currentNode.firstChild;
//                 } else {
//                   // 移動到下一個節點
//                   while (currentNode && !currentNode.nextSibling) {
//                     currentNode = currentNode.parentNode as ChildNode | null;
//                   }
//                   if (currentNode) {
//                     currentNode = currentNode.nextSibling;
//                   }
//                 }
//               }

//               // 如果找到正確的節點，設定範圍並刪除
//               if (startNode && endNode) {
//                 console.log('找到 shortcut 位置:', startNode, startOffset, endNode, endOffset);

//                 // 設定範圍
//                 const newRange = document.createRange();
//                 newRange.setStart(startNode, startOffset);
//                 newRange.setEnd(endNode, endOffset);

//                 // 先選取範圍
//                 selection.removeAllRanges();
//                 selection.addRange(newRange);

//                 // 使用 execCommand 刪除並插入文字，保留 HTML 結構
//                 const success = document.execCommand('insertText', false, cleanPrompt);

//                 if (!success) {
//                   // 刪除 shortcut
//                   newRange.deleteContents();

//                   // 建立片段來插入 HTML 內容
//                   const tempDiv = document.createElement('div');
//                   tempDiv.innerHTML = originalPrompt;
//                   const fragment = document.createDocumentFragment();
//                   while (tempDiv.firstChild) {
//                     fragment.appendChild(tempDiv.firstChild);
//                   }
//                   newRange.insertNode(fragment);

//                   // 移動游標到末端
//                   newRange.collapse(false);
//                   selection.removeAllRanges();
//                   selection.addRange(newRange);

//                 }
//               } else {
//                 console.warn('無法找到 shortcut 位置，使用備用方案');
//                 // 備用方案：直接在當前位置插入
//                 await insertTextAtCursor(cleanPrompt);
//               }
//             } catch (error) {
//               console.error('設定範圍時發生錯誤:', error);
//               // 備用方案：直接使用 insertTextAtCursor
//               await insertTextAtCursor(cleanPrompt);
//             }
//           }
//         }
//         // Clean up stored shortcut info
//         chrome.storage.local.remove('shortcutInfo');
//         sendResponse({ success: true });
//       } else {
//         // Fallback to normal insertion if no shortcut info
//         const success = await insertTextAtCursor(cleanPrompt);
//         sendResponse({ success });
//       }
//     });
//     return true;
//   }
//   sendResponse({ success: false, error: 'Unknown action' });
//   return false;
// });

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'insertPrompt') {
    if (!message.prompt) {
      sendResponse({ success: false, error: 'Invalid prompt data' });
      return false;
    }

    // Get stored shortcut info
    chrome.storage.local.get('shortcutInfo', async result => {
      // const cleanPrompt = stripHtml(message.prompt);
      const element = getDeepActiveElement();
      // 為純文字欄位使用 stripHtml
      const cleanPrompt = stripHtml(message.prompt);
      // 為支援 HTML 的元素保留原始 HTML
      const originalPrompt = message.prompt;

      if (element && result.shortcutInfo) {
        console.log('Shortcut info:', result.shortcutInfo);
        // Remove the shortcut text first
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          console.log('執行 input/textarea 的插入');
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
            try {
              // 取得完整的文字內容和位置資訊
              const elementContent = element.textContent || '';
              const { start, end } = result.shortcutInfo.position;
              console.log('要移除的 shortcut:', elementContent.substring(start, end));

              // 找出正確的節點和位置
              let currentNode = element.firstChild;
              let currentOffset = 0;
              let startNode = null;
              let startOffset = 0;
              let endNode = null;
              let endOffset = 0;

              // 遍歷所有節點尋找正確的起始和結束位置
              while (currentNode && (!startNode || !endNode)) {
                // 只處理文字節點
                if (currentNode.nodeType === Node.TEXT_NODE) {
                  const textLength = currentNode.textContent?.length || 0;

                  // 找到起始節點
                  if (!startNode && currentOffset + textLength > start) {
                    startNode = currentNode;
                    startOffset = start - currentOffset;
                  }

                  // 找到結束節點
                  if (!endNode && currentOffset + textLength >= end) {
                    endNode = currentNode;
                    endOffset = end - currentOffset;
                    break;
                  }

                  currentOffset += textLength;
                }

                // 檢查子節點
                if (currentNode.firstChild) {
                  currentNode = currentNode.firstChild;
                } else {
                  // 移動到下一個節點
                  while (currentNode && !currentNode.nextSibling) {
                    currentNode = currentNode.parentNode as ChildNode | null;
                  }
                  if (currentNode) {
                    currentNode = currentNode.nextSibling;
                  }
                }
              }

              // 如果找到正確的節點，設定範圍並刪除
              if (startNode && endNode) {
                console.log('找到 shortcut 位置:', startNode, startOffset, endNode, endOffset);

                // 設定範圍
                const newRange = document.createRange();
                newRange.setStart(startNode, startOffset);
                newRange.setEnd(endNode, endOffset);

                // 先選取範圍
                selection.removeAllRanges();
                selection.addRange(newRange);

                // 使用 execCommand 刪除並插入文字，保留 HTML 結構
                const success = document.execCommand('insertText', false, cleanPrompt);

                if (!success) {
                  // 刪除 shortcut
                  newRange.deleteContents();

                  // 建立片段來插入 HTML 內容
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = originalPrompt;
                  const fragment = document.createDocumentFragment();
                  while (tempDiv.firstChild) {
                    fragment.appendChild(tempDiv.firstChild);
                  }
                  newRange.insertNode(fragment);

                  // 移動游標到末端
                  newRange.collapse(false);
                  selection.removeAllRanges();
                  selection.addRange(newRange);
                }
              } else {
                console.warn('無法找到 shortcut 位置，使用備用方案');
                // 備用方案：直接在當前位置插入
                await insertTextAtCursor(cleanPrompt);
              }
            } catch (error) {
              console.error('設定範圍時發生錯誤:', error);
              // 備用方案：直接使用 insertTextAtCursor
              await insertTextAtCursor(cleanPrompt);
            }
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
