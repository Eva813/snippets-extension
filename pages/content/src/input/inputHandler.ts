import { getDeepActiveElement } from '@src/textInserter';
import { getCursorInfo } from '@src/cursor/getCursorInfo';
import { getSnippetByShortcut } from '../snippet/snippetManager';
import { stripHtml, isEditableElement } from '../utils/utils';
import { findTextRangeNodes } from '@src/utils/findTextRangeNodes';
import { insertIntoRange } from '@src/utils/insertIntoRange';
import type { Snippet, CursorInfo } from '@src/types';
import { updateCursorPosition } from '@src/cursor/cursorTracker';

// 建立 debounce
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: number | null = null;

  return function (...args: Parameters<T>) {
    if (timeout !== null) {
      window.clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

const debouncedUpdateCursorPosition = debounce(updateCursorPosition, 300);

export function initializeInputHandler() {
  document.addEventListener('input', handleInput);
  console.info('輸入事件監聽已啟動');
}

// 處理輸入事件 - 偵測快捷鍵並進行插入
async function handleInput(event: Event) {
  const target = event.target as HTMLElement;
  const element = getDeepActiveElement();
  if (!isEditableElement(element)) {
    console.log('不是可編輯元素，返回');
    return;
  }
  debouncedUpdateCursorPosition(target);

  // 獲取游標資訊並尋找快捷鍵
  const cursorInfo = getCursorInfo(target);
  const snippet = await findShortcutNearCursor(cursorInfo);

  // 如果找到匹配的程式碼片段，則處理插入
  if (snippet) {
    await processSnippetInsertion(snippet, element as HTMLElement, cursorInfo);
  }
}

// 在游標位置附近查找快捷鍵
async function findShortcutNearCursor(cursorInfo: CursorInfo): Promise<Snippet | null> {
  const textToCheck = cursorInfo.textBeforeCursor;
  const lastWord = textToCheck.trim().split(/\s+/).pop() || '';
  console.log('找到的最後一個單詞:', lastWord);
  // 先從本地快取查找
  const snippet = getSnippetByShortcut(lastWord);
  if (snippet) {
    return {
      shortcut: lastWord,
      content: snippet.content,
      name: snippet.name,
    };
  }

  try {
    // 如果本地快取沒有，則向背景發送訊息查詢
    const response = await chrome.runtime.sendMessage({
      action: 'getSnippetByShortcut',
      shortcut: lastWord,
    });

    if (response?.snippet) {
      return {
        shortcut: lastWord,
        content: response.snippet.content,
        name: response.snippet.name,
      };
    }
  } catch (error) {
    console.error('取得程式碼片段失敗:', error);
  }

  return null;
}

async function processSnippetInsertion(snippet: Snippet, element: HTMLElement, cursorInfo: CursorInfo) {
  // 檢查是否包含表單欄位
  const hasFormField = snippet.content.includes('data-snippet');

  if (!hasFormField) {
    // 純文字插入，直接處理
    const insertData: Snippet = {
      ...snippet,
      content: stripHtml(snippet.content),
    };

    insertContent(element, insertData, cursorInfo);
    return;
  }

  const shortcutInfo = {
    shortcut: snippet.shortcut,
    position: {
      start: cursorInfo.start - snippet.shortcut.length,
      end: cursorInfo.start,
    },
  };

  await chrome.storage.local.set({ shortcutInfo });

  const title = `${snippet.shortcut} - ${snippet.name}`;
  chrome.runtime.sendMessage({ action: 'createWindow', title, content: snippet.content });
}

// 插入內容到指定元素
function insertContent(element: HTMLElement, snippet: Snippet, cursorInfo: CursorInfo) {
  const shortcutStart = cursorInfo.textBeforeCursor.lastIndexOf(snippet.shortcut);
  if (shortcutStart === -1) return;

  const beforeShortcut = cursorInfo.textBeforeCursor.slice(0, shortcutStart);
  const combinedText = beforeShortcut + snippet.content + cursorInfo.textAfterCursor;

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    // 處理一般的輸入元素
    element.value = combinedText;
    const cursorPos = beforeShortcut.length + snippet.content.length;
    element.setSelectionRange(cursorPos, cursorPos);

    // 觸發事件通知框架更新
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (element.isContentEditable) {
    // 處理富文字編輯器
    insertContentToContentEditable(element, snippet.content, cursorInfo, snippet.shortcut.length);
  }
}

// 插入內容到 contentEditable 元素
function insertContentToContentEditable(
  element: HTMLElement,
  content: string,
  cursorInfo: CursorInfo,
  shortcutLength: number,
) {
  // 尋找文字範圍節點
  const { startNode, endNode, startOffset, endOffset } = findTextRangeNodes(
    element,
    cursorInfo.start - shortcutLength,
    cursorInfo.start,
  );

  if (!startNode || !endNode) {
    console.warn('無法找到範圍，取消插入');
    return;
  }

  // 建立範圍並插入內容
  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  insertIntoRange(range, content);
}
