import { getDeepActiveElement } from '@src/textInserter';
import { getCursorInfo } from '@src/cursor/getCursorInfo';
import { getPromptByShortcut } from '../prompt/promptManager';
import { stripHtml, isEditableElement } from '../utils/utils';
import { findTextRangeNodes } from '@src/utils/findTextRangeNodes';
import { insertIntoRange } from '@src/utils/insertIntoRange';
import type { Prompt, CursorInfo } from '@src/types';
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
}

export function clearInputHandler(): void {
  document.removeEventListener('input', handleInput);
}

// 處理輸入事件 - 偵測快捷鍵並進行插入
async function handleInput(event: Event) {
  const target = event.target as HTMLElement;
  const element = getDeepActiveElement();
  if (!isEditableElement(element)) {
    return;
  }
  debouncedUpdateCursorPosition(target);

  // 獲取游標資訊並尋找快捷鍵
  const cursorInfo = getCursorInfo(target);
  const prompt = await findShortcutNearCursor(cursorInfo);

  // 如果找到匹配的程式碼片段，則處理插入
  if (prompt) {
    await processPromptInsertion(prompt, element as HTMLElement, cursorInfo);
  }
}

// 在游標位置附近查找快捷鍵
async function findShortcutNearCursor(cursorInfo: CursorInfo): Promise<Prompt | null> {
  const textToCheck = cursorInfo.textBeforeCursor;

  // 檢查最後一個斷行符號的位置
  const lastNewLineIndex = Math.max(textToCheck.lastIndexOf('\n'), textToCheck.lastIndexOf('\r'));

  // 取得最後一行的文字
  const lastLineText = lastNewLineIndex >= 0 ? textToCheck.substring(lastNewLineIndex + 1) : textToCheck;

  // 策略 1: 優先檢查常見的前綴格式 (如 /, #, ! 等)
  const prefixMatch = lastLineText.match(/[/#!@][a-zA-Z0-9_-]+$/);
  if (prefixMatch) {
    const prefixCandidate = prefixMatch[0];
    const result = await checkPromptCandidate(prefixCandidate);
    if (result) return result;
  }

  // 策略 2: 檢查以空白分隔的最後一個單詞
  const lastWord = lastLineText.trim().split(/\s+/).pop() || '';
  if (lastWord) {
    const result = await checkPromptCandidate(lastWord);
    if (result) return result;
  }

  // 策略 3: 漸進式檢查 (限制在合理範圍，如 5 個字元)，只檢查最後幾個字元，而不是整行
  const maxLength = Math.min(5, lastLineText.trim().length);
  const trimmedEnd = lastLineText.trim().slice(-maxLength);

  // 從最短的可能快捷鍵開始檢查 (至少 1 個字元)
  for (let i = 1; i <= maxLength; i++) {
    const candidate = trimmedEnd.slice(-i);
    if (candidate !== lastWord) {
      // 避免重複檢查
      const result = await checkPromptCandidate(candidate);
      if (result) return result;
    }
  }

  return null;
}
async function checkPromptCandidate(candidate: string): Promise<Prompt | null> {
  // 先從本地快取查找
  const prompt = getPromptByShortcut(candidate);
  if (prompt) {
    return {
      shortcut: candidate,
      content: prompt.content,
      name: prompt.name,
    };
  }

  try {
    // 檢查背景服務連線狀態
    if (!chrome.runtime?.id) {
      console.warn('Extension is not enabled or background service is not running');
      return null;
    }
    // 如果本地沒有，再向背景發送訊息
    const response = await chrome.runtime.sendMessage({
      action: 'getPromptByShortcut',
      shortcut: candidate,
    });

    if (response?.prompt) {
      return {
        shortcut: candidate,
        content: response.prompt.content,
        name: response.prompt.name,
      };
    }
  } catch (error) {
    console.error('取得提示失敗:', error);
  }

  return null;
}

async function processPromptInsertion(prompt: Prompt, element: HTMLElement, cursorInfo: CursorInfo) {
  // 檢查是否包含表單欄位
  const hasFormField = prompt.content.includes('data-prompt');

  if (!hasFormField) {
    // 純文字插入，直接處理
    const insertData: Prompt = {
      ...prompt,
      content: stripHtml(prompt.content),
    };

    insertContent(element, insertData, cursorInfo);
    return;
  }

  const shortcutInfo = {
    shortcut: prompt.shortcut,
    position: {
      start: cursorInfo.start - prompt.shortcut.length,
      end: cursorInfo.start,
    },
  };

  await chrome.storage.local.set({ shortcutInfo });

  const title = `${prompt.shortcut} - ${prompt.name}`;
  chrome.runtime.sendMessage({ action: 'createWindow', title, content: prompt.content });
}

// 插入內容到指定元素
function insertContent(element: HTMLElement, prompt: Prompt, cursorInfo: CursorInfo) {
  const shortcutStart = cursorInfo.textBeforeCursor.lastIndexOf(prompt.shortcut);
  if (shortcutStart === -1) return;

  const beforeShortcut = cursorInfo.textBeforeCursor.slice(0, shortcutStart);
  const combinedText = beforeShortcut + prompt.content + cursorInfo.textAfterCursor;

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    // 處理一般的輸入元素
    element.value = combinedText;
    const cursorPos = beforeShortcut.length + prompt.content.length;
    element.setSelectionRange(cursorPos, cursorPos);

    // 觸發事件通知框架更新
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (element.isContentEditable) {
    // 處理富文字編輯器
    insertContentToContentEditable(element, prompt.content, cursorInfo, prompt.shortcut.length);
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
