// import dialog css file
import './dialog.css';
import { insertTextAtCursor } from './insertSnippet';
// Types for snippets and positions
interface Snippet {
  shortcut: string;
  content: string;
}

interface CursorInfo {
  start: number;
  end: number;
  textBeforeCursor: string;
  textAfterCursor: string;
}

// Sample snippets
const snippets: Snippet[] = [
  { shortcut: '/er', content: 'Example content for /er' },
  { shortcut: '/do', content: 'Example content for /do' },
];

// Get cursor position and surrounding text
// function getCursorInfo(element: HTMLElement): CursorInfo {
//   let start = 0, end = 0, textBeforeCursor = '', textAfterCursor = '';

//   if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
//     start = element.selectionStart ?? 0;
//     end = element.selectionEnd ?? 0;
//     textBeforeCursor = element.value.substring(0, start);
//     textAfterCursor = element.value.substring(end);
//   } else if (element.isContentEditable) {
//     const selection = window.getSelection();
//     if (selection && selection.rangeCount > 0) {
//       const range = selection.getRangeAt(0);
//       const preRange = range.cloneRange();
//       preRange.selectNodeContents(element);
//       preRange.setEnd(range.startContainer, range.startOffset);
//       start = preRange.toString().length;
//       end = start + range.toString().length;

//       // Get text before and after cursor
//       const fullText = element.innerText;
//       textBeforeCursor = fullText.substring(0, start);
//       textAfterCursor = fullText.substring(end);
//     }
//   }

//   return { start, end, textBeforeCursor, textAfterCursor };
// }

function getCursorInfo(element: HTMLElement): CursorInfo {
  let start = 0,
    end = 0,
    textBeforeCursor = '',
    textAfterCursor = '';

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    start = element.selectionStart ?? 0;
    end = element.selectionEnd ?? 0;
    textBeforeCursor = element.value.substring(0, start);
    textAfterCursor = element.value.substring(end);
  } else if (element.isContentEditable) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preRange = range.cloneRange();
      preRange.selectNodeContents(element);
      preRange.setEnd(range.startContainer, range.startOffset);
      start = preRange.toString().length;
      end = start + range.toString().length;

      // 解決換行問題：處理內部HTML結構，避免換行問題
      const fullText = element.textContent || '';
      textBeforeCursor = fullText.substring(0, start);
      textAfterCursor = fullText.substring(end);
    }
  }

  return { start, end, textBeforeCursor, textAfterCursor };
}

// Find shortcut near cursor position
function findShortcutNearCursor(cursorInfo: CursorInfo): Snippet | null {
  // Look for shortcuts in text before cursor
  const textToCheck = cursorInfo.textBeforeCursor;

  for (const snippet of snippets) {
    // Check if text ends with shortcut
    if (textToCheck.endsWith(snippet.shortcut)) {
      return snippet;
    }

    // Optional: Check if shortcut is within last N characters
    // const lastNChars = textToCheck.slice(-20); // Adjust window size as needed
    // if (lastNChars.includes(snippet.shortcut)) {
    //   return snippet;
    // }
  }

  return null;
}

// Insert content and update cursor position
function insertContent(element: HTMLElement, snippet: Snippet, cursorInfo: CursorInfo) {
  const shortcutStart = cursorInfo.textBeforeCursor.lastIndexOf(snippet.shortcut);
  if (shortcutStart === -1) return;

  const textBeforeShortcut = cursorInfo.textBeforeCursor.substring(0, shortcutStart);
  const newText = textBeforeShortcut + snippet.content + cursorInfo.textAfterCursor;

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.value = newText;
    const newCursorPos = shortcutStart + snippet.content.length;
    element.setSelectionRange(newCursorPos, newCursorPos);
  } else if (element.isContentEditable) {
    const selection = window.getSelection();
    if (selection) {
      const range = selection.getRangeAt(0);

      // 刪除快捷方式的文字
      const preRange = document.createRange();
      preRange.setStart(range.startContainer, range.startOffset - snippet.shortcut.length);
      preRange.setEnd(range.startContainer, range.startOffset);
      preRange.deleteContents();

      // 插入新的內容
      const textNode = document.createTextNode(snippet.content);
      range.insertNode(textNode);

      // 將游標移動到新插入內容的結尾
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}

// Main input event handler
function handleInput(event: Event) {
  const target = event.target as HTMLElement;
  if (!isEditableElement(target)) return;

  const cursorInfo = getCursorInfo(target);
  const snippet = findShortcutNearCursor(cursorInfo);

  if (snippet) {
    showDialog(snippet, target, cursorInfo);
  }
}

// Same helper functions as before
function isEditableElement(target: EventTarget): target is HTMLElement {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  );
}

// Modified dialog to include cursor info
function showDialog(snippet: Snippet, target: HTMLElement, cursorInfo: CursorInfo) {
  const dialog = document.createElement('div');
  dialog.style.position = 'fixed';
  dialog.style.top = '50%';
  dialog.style.left = '50%';
  dialog.style.transform = 'translate(-50%, -50%)';
  dialog.style.zIndex = '10000';

  const shadowRoot = dialog.attachShadow({ mode: 'open' });

  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .dialog-content {
      color: black !important;
      font-family: Arial, sans-serif;
      background: white;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
  `;

  shadowRoot.appendChild(styleElement);

  shadowRoot.innerHTML += `
    <div class="dialog-content">
      <p>${snippet.content}</p>
      <button id="insert-button" style="margin-right: 10px;">Insert</button>
      <button id="cancel-button">Cancel</button>
    </div>
  `;

  document.body.appendChild(dialog);

  shadowRoot.getElementById('insert-button')?.addEventListener('click', () => {
    insertContent(target, snippet, cursorInfo);
    document.body.removeChild(dialog);
  });

  shadowRoot.getElementById('cancel-button')?.addEventListener('click', () => {
    document.body.removeChild(dialog);
  });
}

// Add event listener
document.addEventListener('input', handleInput);

// insertSnippet.ts
// 訊息處理
// chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
//   if (message.action === 'insertPrompt') {
//     console.log('Received insertPrompt message:', message);
//     insertTextAtCursor(message.prompt)
//       .then(success => {
//         const hasFormFields = message.prompt.content.includes('data-type="formtext"');
//         console.log('Form fields found:', hasFormFields);
//         sendResponse({ success })}
//       )
//       .catch(error => sendResponse({ success: false, error: error.message }));
//     return true;
//   }
//   return false;
// });

// 去除 HTML 標籤
const stripHtml = (html: string) => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};

// chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
//   if (message.action === 'insertPrompt') {
//     console.log('Received insertPrompt message:', message);

//     // 確保 message.prompt 存在，避免 undefined 錯誤
//     if (!message.prompt) {
//       sendResponse({ success: false, error: 'Invalid prompt data' });
//       return false;
//     }
//     // 處理字段
//     const hasFormFields = message.prompt.includes('data-type="formtext"');
//     console.log('Form fields found:', hasFormFields);
//     // 如果 hasFormFields 為 true，要進行特別處理
//     // 若為 false，則直接去除 p tag 並插入文字
//     const targetDocument = window.top ? window.top.document : document;
//     if(!hasFormFields) {
//       // 移除所有 HTML tags 並插入文字
//       message.prompt = stripHtml(message.prompt);
//     }else {
//       console.log('qwewwqe:');
//       // 跳出 iframe 並插入文字。先插入 HTML，再處理 form text field
//       // 先插入 HTML
//       const temp = targetDocument.createElement('div');
//       temp.innerHTML = message.prompt;

//       // 處理 form text field
//       const formTextFields = temp.querySelectorAll('[data-type="formtext"]');
//       formTextFields.forEach(field => {
//         console.log('Form text field found:', field);
//         const label = field.getAttribute('label') || '';
//         if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
//           field.value = label;
//         } else {
//           field.textContent = label;
//         }
//       });

//       message.prompt = temp.innerHTML;

//     }

//     insertTextAtCursor(message.prompt)
//       .then(success => {

//         sendResponse({ success });
//       })
//       .catch(error => {
//         console.error('Error inserting text:', error);
//         sendResponse({ success: false, error: error.message });
//       });

//     return true; // 告知 Chrome 這個 listener 是異步的
//   }

//   return false;
// });

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'insertPrompt') {
    console.log('Received insertPrompt message:', message);

    if (!message.prompt) {
      sendResponse({ success: false, error: 'Invalid prompt data' });
      return false;
    }

    const hasFormFields = message.prompt.includes('data-type="formtext"');
    console.log('Form fields found:', hasFormFields);

    const targetDocument = window.top ? window.top.document : document;

    if (!hasFormFields) {
      message.prompt = stripHtml(message.prompt);
      insertTextAtCursor(message.prompt)
        .then(success => sendResponse({ success }))
        .catch(error => {
          console.error('Error inserting text:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    } else {
      console.log('處理含表單欄位的 prompt，將於 iframe 中顯示');
      const iframe = targetDocument.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '10%';
      iframe.style.left = '10%';
      iframe.style.width = '80%';
      iframe.style.height = '80%';
      iframe.style.zIndex = '9999';
      iframe.style.border = '1px solid #ccc';
      iframe.style.background = '#fff';
      targetDocument.body.appendChild(iframe);

      iframe.onload = () => {
        const iDoc = iframe.contentDocument || (iframe.contentWindow ? iframe.contentWindow.document : null);
        if (!iDoc) {
          console.error('Unable to access iframe document');
          sendResponse({ success: false, error: 'Unable to access iframe document' });
          return;
        }

        // 確保 iframe 有基本 HTML 結構
        if (!iDoc.body) {
          iDoc.open();
          iDoc.write('<html><head><meta charset="UTF-8"><title>Form</title></head><body></body></html>');
          iDoc.close();
        }

        const container = iDoc.createElement('div');
        container.innerHTML = message.prompt;

        // 轉換所有 formtext 欄位為 input
        const formFields = container.querySelectorAll('[data-type="formtext"]');
        formFields.forEach(field => {
          const input = iDoc.createElement('input');
          input.type = 'text';
          const placeholder = field.getAttribute('label') || '';
          input.placeholder = placeholder;
          const defaultValue = field.getAttribute('defaultvalue') || '';
          input.value = defaultValue;
          input.className = field.className;
          if (field.parentNode) {
            field.parentNode.replaceChild(input, field);
          }
        });

        // 建立 Submit 與 Cancel 按鈕
        const submitButton = iDoc.createElement('button');
        submitButton.textContent = 'Submit';
        submitButton.style.marginRight = '10px';

        const cancelButton = iDoc.createElement('button');
        cancelButton.textContent = 'Cancel';

        container.appendChild(submitButton);
        container.appendChild(cancelButton);

        iDoc.body.appendChild(container);

        // Submit 按鈕事件：取得使用者輸入並插入最終文本
        submitButton.addEventListener('click', () => {
          const inputs = container.querySelectorAll('input');
          let finalPrompt = message.prompt;
          inputs.forEach((input, index) => {
            const key = `{{field${index + 1}}}`;
            finalPrompt = finalPrompt.replace(key, input.value);
          });

          iframe.remove();
          insertTextAtCursor(finalPrompt)
            .then(success => sendResponse({ success }))
            .catch(error => {
              console.error('Error inserting text:', error);
              sendResponse({ success: false, error: error.message });
            });
        });

        // Cancel 按鈕事件：關閉 iframe
        cancelButton.addEventListener('click', () => {
          iframe.remove();
          sendResponse({ success: false, error: 'User canceled input' });
        });

        sendResponse({ success: true });
      };

      if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
        iframe.onload(new Event('load'));
      }

      return true;
    }
  }
  return false;
});
