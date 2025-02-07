// import dialog css file
import './dialog.css';
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
