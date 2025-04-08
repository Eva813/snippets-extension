import './messageHandler';
import { stripHtml } from './utils/utils';
import { getDeepActiveElement } from './textInserter';
import { findTextRangeNodes } from '@src/utils/findTextRangeNodes';
import { insertIntoRange } from '@src/utils/insertIntoRange';
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

async function setupSnippetCache(): Promise<void> {
  // 初始化快取
  const result = await chrome.storage.local.get('snippets');
  snippetsCache = result.snippets || {};
  console.log('初始化 snippets 快取:', snippetsCache);

  chrome.storage.onChanged.addListener(changes => {
    if (changes.snippets) {
      snippetsCache = changes.snippets.newValue;
      console.log('快取 snippets 已更新:', snippetsCache);
    }
  });
}

// 獲取游標資訊
function getCursorInfo(element: HTMLElement): CursorInfo {
  let start = 0,
    end = 0;
  let textBeforeCursor = '',
    textAfterCursor = '';

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    start = element.selectionStart ?? 0;
    end = element.selectionEnd ?? 0;
    textBeforeCursor = element.value.slice(0, start);
    textAfterCursor = element.value.slice(end);
  } else if (element.isContentEditable) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return { start, end, textBeforeCursor, textAfterCursor };

    const range = selection.getRangeAt(0);
    const preRange = range.cloneRange();
    preRange.selectNodeContents(element);
    preRange.setEnd(range.startContainer, range.startOffset);

    start = preRange.toString().length;
    end = start + range.toString().length;

    const fullText = element.textContent || '';
    textBeforeCursor = fullText.slice(0, start);
    textAfterCursor = fullText.slice(end);
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

// Insert content and update cursor position
function insertContent(element: HTMLElement, snippet: Snippet, cursorInfo: CursorInfo) {
  const shortcutStart = cursorInfo.textBeforeCursor.lastIndexOf(snippet.shortcut);
  if (shortcutStart === -1) return;

  const beforeShortcut = cursorInfo.textBeforeCursor.slice(0, shortcutStart);
  const combinedText = beforeShortcut + snippet.content + cursorInfo.textAfterCursor;

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.value = combinedText;
    const cursorPos = beforeShortcut.length + snippet.content.length;
    element.setSelectionRange(cursorPos, cursorPos);
  } else if (element.isContentEditable) {
    insertContentToContentEditable(element, snippet.content, cursorInfo, snippet.shortcut.length);
  }
}

function insertContentToContentEditable(
  element: HTMLElement,
  content: string,
  cursorInfo: CursorInfo,
  shortcutLength: number,
) {
  const { startNode, endNode, startOffset, endOffset } = findTextRangeNodes(
    element,
    cursorInfo.start - shortcutLength,
    cursorInfo.start,
  );

  if (!startNode || !endNode) {
    console.warn('無法找到範圍，取消插入');
    return;
  }

  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  insertIntoRange(range, content);
}

// input event handler 在這裡處理在瀏覽器直接輸入 shortcut 的情況
async function handleInput(event: Event) {
  const target = event.target as HTMLElement;
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
    await processSnippetInsertion(snippet, element as HTMLElement, cursorInfo);
  }
}

async function processSnippetInsertion(snippet: Snippet, element: HTMLElement, cursorInfo: CursorInfo) {
  console.log('處理 snippet 插入:', snippet.content);
  const hasFormField = snippet.content.includes('data-snippet');

  if (!hasFormField) {
    console.log('只有純文字，立馬插入', snippet);

    const insertData: Snippet = {
      ...snippet,
      content: stripHtml(snippet.content),
    };

    insertContent(element, insertData, cursorInfo);
    return;
  }

  console.log('有表單欄位，開啟 popup');

  const shortcutInfo = {
    shortcut: snippet.shortcut,
    position: {
      start: cursorInfo.start - snippet.shortcut.length,
      end: cursorInfo.start,
    },
  };

  await chrome.storage.local.set({ shortcutInfo });

  const title = `${snippet.shortcut} - ${snippet.name}`;
  const content = snippet.content;

  chrome.runtime.sendMessage({ action: 'createWindow', title, content }, response => {
    console.log('Window creation response:', response);
  });
}

initialize();
// Add event listener
async function initialize() {
  await setupSnippetCache();

  console.log('Snippet 快取完成，開始監聽輸入事件');
  document.addEventListener('input', handleInput);
}
