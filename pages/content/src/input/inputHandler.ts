import { getDeepActiveElement } from '@src/textInserter';
import { getCursorInfo } from '@src/cursor/getCursorInfo';
import { getPromptByShortcut } from '../prompt/promptManager';
import { isEditableElement } from '../utils/utils';
import { insertContent as insertContentService } from '../services/insertionService';
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

  console.log('Prompt processing:', {
    shortcut: prompt.shortcut,
    content: prompt.content,
    name: prompt.name,
    hasFormField,
  });

  if (!hasFormField) {
    // 使用統一的插入服務
    const shortcutStart = cursorInfo.textBeforeCursor.lastIndexOf(prompt.shortcut);
    if (shortcutStart === -1) return;

    const position = {
      start: shortcutStart,
      end: cursorInfo.start,
    };

    const result = await insertContentService({
      content: prompt.content,
      targetElement: element,
      position,
      saveCursorPosition: true,
    });

    if (!result.success) {
      console.error('插入失敗:', result.error);
    }
    return;
  }

  console.log('Prompt contains form fields, opening in new window:', prompt);

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
