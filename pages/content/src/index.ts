// import dialog css file
import './dialog.css';
import './messageHandler';
import { stripHtml, convertTemplate } from './utils';
// Types for snippets and positions
interface Snippet {
  shortcut: string;
  content: string;
  name?: string;
}

interface CursorInfo {
  start: number;
  end: number;
  textBeforeCursor: string;
  textAfterCursor: string;
}
///

///
// Sample snippets
// const snippets: Snippet[] = [
//   { shortcut: '/er', content: 'Example content for /er' },
//   { shortcut: '/do', content: 'Example content for /do' },
// ];
console.log('Content script loaded');
// Get cursor position and surrounding text
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
// New 找位置
// function findShortcutNearCursor(cursorInfo: CursorInfo): Snippet | null {
//   const textToCheck = cursorInfo.textBeforeCursor;

//   // 檢查文字是否以 '/' 開頭的快捷方式結尾
//   const shortcutMatch = textToCheck.match(/\/[^\s]+$/);
//   if (shortcutMatch) {
//     const shortcut = shortcutMatch[0];
//     // 返回一個基本的 Snippet 物件，實際內容會透過 chrome.runtime.sendMessage 取得
//     return {
//       shortcut: shortcut,
//       content: '', // 內容會在 handleInput 中透過訊息機制填入
//       name: ''
//     };
//   }

//   return null;
// }

async function findShortcutNearCursor(cursorInfo: CursorInfo): Promise<Snippet | null> {
  const textToCheck = cursorInfo.textBeforeCursor;

  // 取得輸入框最後一段文字
  const lastWord = textToCheck.trim().split(/\s+/).pop() || '';
  console.log('檢查輸入:', lastWord);

  try {
    // 使用 chrome.runtime.sendMessage Promise 版本
    const response = await chrome.runtime.sendMessage({
      action: 'getSnippetByShortcut',
      shortcut: lastWord,
    });

    console.log('取得 snippet 回應:', response);

    if (response?.snippet) {
      return {
        shortcut: lastWord,
        content: response.snippet.content,
        name: response.snippet.name,
      };
    }
  } catch (error) {
    console.error('取得 snippet 失敗:', error);
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
// function handleInput(event: Event) {
//   const target = event.target as HTMLElement;
//   if (!isEditableElement(target)) return;

//   const cursorInfo = getCursorInfo(target);
//   const snippet = findShortcutNearCursor(cursorInfo);

//   if (snippet) {
//     showDialog(snippet, target, cursorInfo);
//   }
// }
// New
async function handleInput(event: Event) {
  const target = event.target as HTMLElement;
  if (!isEditableElement(target)) return;

  const cursorInfo = getCursorInfo(target);
  // const snippet = findShortcutNearCursor(cursorInfo);
  // console.log('snippet', snippet)
  const snippet = await findShortcutNearCursor(cursorInfo);
  console.log('snippet data', snippet);
  if (snippet) {
    // 发送消息请求对应的 snippet 内容
    // chrome.runtime.sendMessage({ action: 'getSnippetByShortcut', shortcut: snippet.shortcut }, (response) => {
    // if (response.snippet) {

    // 這邊要檢查
    // 檢查 snippet.content 是否包含 'data-type="formtext"'
    const hasFormField = snippet.content.includes('data-type="formtext"');
    if (!hasFormField) {
      console.log('sdfsf', snippet);
      const insertData = {
        ...snippet,
        content: stripHtml(snippet.content),
      };
      insertContent(target, insertData, cursorInfo);
    } else {
      // 呼叫 backgroun
      console.log('snippet convert', snippet);
      const { convertedHtml, initialData } = convertTemplate(snippet.content);
      const title = `${snippet.shortcut} - ${snippet.name}`;
      // 發送訊息給 background，讓它暫存轉換後的資料，並建立 popup
      chrome.runtime.sendMessage({ action: 'createWindow', convertedHtml, initialData, title }, response => {
        console.log('Window creation response:', response);
      });
      insertContent(target, snippet, cursorInfo);
    }
    // insertContent(target, response.snippet, cursorInfo);
    // }
    // });
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
// function showDialog(snippet: Snippet, target: HTMLElement, cursorInfo: CursorInfo) {
//   const dialog = document.createElement('div');
//   dialog.style.position = 'fixed';
//   dialog.style.top = '50%';
//   dialog.style.left = '50%';
//   dialog.style.transform = 'translate(-50%, -50%)';
//   dialog.style.zIndex = '10000';

//   const shadowRoot = dialog.attachShadow({ mode: 'open' });

//   const styleElement = document.createElement('style');
//   styleElement.textContent = `
//     .dialog-content {
//       color: black !important;
//       font-family: Arial, sans-serif;
//       background: white;
//       padding: 20px;
//       border: 1px solid #ccc;
//       border-radius: 8px;
//       box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
//     }
//   `;

//   shadowRoot.appendChild(styleElement);

//   shadowRoot.innerHTML += `
//     <div class="dialog-content">
//       <p>${snippet.content}</p>
//       <button id="insert-button" style="margin-right: 10px;">Insert</button>
//       <button id="cancel-button">Cancel</button>
//     </div>
//   `;

//   document.body.appendChild(dialog);

//   shadowRoot.getElementById('insert-button')?.addEventListener('click', () => {
//     insertContent(target, snippet, cursorInfo);
//     document.body.removeChild(dialog);
//   });

//   shadowRoot.getElementById('cancel-button')?.addEventListener('click', () => {
//     document.body.removeChild(dialog);
//   });
// }

// Add event listener
document.addEventListener('input', handleInput);
