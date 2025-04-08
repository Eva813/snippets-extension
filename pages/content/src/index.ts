import './messageHandler';
import { stripHtml } from './utils';
import { getDeepActiveElement } from './textInserter';
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

interface SnippetCache {
  [key: string]: Snippet;
}

let snippetsCache: SnippetCache = {};

// Initialize cache when content script loads
async function initializeSnippetsCache() {
  const result = await chrome.storage.local.get('snippets');
  console.log('取得快捷方式:', result.snippets);
  snippetsCache = result.snippets || {};
}

// Listen for storage changes
chrome.storage.onChanged.addListener(changes => {
  if (changes.snippets) {
    snippetsCache = changes.snippets.newValue;
  }
});

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
async function findShortcutNearCursor(cursorInfo: CursorInfo): Promise<Snippet | null> {
  const textToCheck = cursorInfo.textBeforeCursor;
  const lastWord = textToCheck.trim().split(/\s+/).pop() || '';
  console.log('檢查輸入:', lastWord);

  // First check local cache
  if (snippetsCache[lastWord]) {
    return {
      shortcut: lastWord,
      content: snippetsCache[lastWord].content,
      name: snippetsCache[lastWord].name,
    };
  }

  try {
    // Fallback to messaging if not in cache
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
// Initialize cache when script loads
initializeSnippetsCache();

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

// Main input event handler 在這裡處理在瀏覽器直接輸入 shortcut 的情況
async function handleInput(event: Event) {
  const target = event.target as HTMLElement;
  console.log('handleInput event.target:', target);
  const element = getDeepActiveElement();
  console.log('handleInput getDeepActiveElement:', element);

  if (
    !element ||
    !(
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      (element as HTMLElement).isContentEditable
    )
  ) {
    console.log('不是可編輯元素，返回');
    return;
  }

  const cursorInfo = getCursorInfo(target);
  const snippet = await findShortcutNearCursor(cursorInfo);
  console.log('取得游標資訊:', cursorInfo, snippet);

  if (snippet) {
    // 檢查 snippet.content 是否包含 'data-type="formtext"'
    const hasFormField = snippet.content.includes('data-type="formtext"');
    if (!hasFormField) {
      console.log('只有純文字，立馬插入', snippet);
      const insertData = {
        ...snippet,
        content: stripHtml(snippet.content),
      };
      insertContent(target, insertData, cursorInfo);
    } else {
      console.log('有表單欄位，開啟 popup');
      // Store cursor position info in storage for later use
      const shortcutInfo = {
        shortcut: snippet.shortcut,
        position: {
          start: cursorInfo.start - snippet.shortcut.length,
          end: cursorInfo.start,
        },
      };
      await chrome.storage.local.set({ shortcutInfo });
      // 呼叫 background
      const title = `${snippet.shortcut} - ${snippet.name}`;
      // 發送訊息給 background，讓它暫存轉換後的資料，並建立 popup
      const content = snippet.content;
      chrome.runtime.sendMessage({ action: 'createWindow', title, content }, response => {
        console.log('Window creation response:', response);
      });
      //insertContent(target, snippet, cursorInfo);
    }
  }
}

// Add event listener
document.addEventListener('input', handleInput);
