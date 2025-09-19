import { getDeepActiveElement } from '@src/utils/getDeepActiveElement';
import { getCursorInfo } from '@src/cursor/getCursorInfo';
import { getPromptByShortcut } from '../prompt/promptManager';
import { isEditableElement } from '../utils/utils';
import { insertContent as insertContentService } from '../services/insertionService';
import type { Prompt, CursorInfo } from '@src/types';
import { updateCursorPosition } from '@src/cursor/cursorTracker';
import type { SupportedContent } from '@extension/shared/lib/tiptap/tiptapConverter';
import { logger } from '@extension/shared/lib/logging/logger';
import { hasFormField } from '@extension/shared/lib/utils/formFieldDetector';

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

// 為快捷鍵檢測創建 debounced 版本，使用較長的延遲以減少不必要的檢查
const debouncedShortcutCheck = debounce(async (element: HTMLElement, cursorInfo: CursorInfo) => {
  const prompt = await findShortcutNearCursor(cursorInfo);
  if (prompt) {
    await processPromptInsertion(prompt, element, cursorInfo);
  }
}, 750);

export function initializeInputHandler() {
  document.addEventListener('input', handleInput);
}

export function clearInputHandler(): void {
  document.removeEventListener('input', handleInput);
}

// 處理輸入事件 - 偵測快捷鍵並進行插入
function handleInput(event: Event) {
  const target = event.target as HTMLElement;
  const element = getDeepActiveElement();
  if (!isEditableElement(element)) {
    return;
  }

  // 更新游標位置 (較短的 debounce)
  debouncedUpdateCursorPosition(target);

  // 獲取游標資訊並進行 debounced 快捷鍵檢測 (較長的 debounce)
  const cursorInfo = getCursorInfo(target);
  debouncedShortcutCheck(element as HTMLElement, cursorInfo);
}

// 在游標位置附近查找快捷鍵
async function findShortcutNearCursor(cursorInfo: CursorInfo): Promise<Prompt | null> {
  const textToCheck = cursorInfo.textBeforeCursor;

  // 檢查最後一個斷行符號的位置
  const lastNewLineIndex = Math.max(textToCheck.lastIndexOf('\n'), textToCheck.lastIndexOf('\r'));

  // 取得最後一行的文字
  const lastLineText = lastNewLineIndex >= 0 ? textToCheck.substring(lastNewLineIndex + 1) : textToCheck;

  // 用 Set 來追蹤已經檢查過的候選者，避免重複檢查
  const checkedCandidates = new Set<string>();

  // 策略 1: 優先檢查常見的前綴格式 (如 /, #, ! 等)
  const prefixMatch = lastLineText.match(/[/#!@][a-zA-Z0-9_-]+$/);
  if (prefixMatch) {
    const prefixCandidate = prefixMatch[0];
    checkedCandidates.add(prefixCandidate);
    const result = await checkPromptCandidate(prefixCandidate);
    if (result) return result;
  }

  // 策略 2: 檢查以空白分隔的最後一個單詞
  const lastWord = lastLineText.trim().split(/\s+/).pop() || '';
  if (lastWord && !checkedCandidates.has(lastWord)) {
    checkedCandidates.add(lastWord);
    const result = await checkPromptCandidate(lastWord);
    if (result) return result;
  }

  // 策略 3: 漸進式檢查 (限制在合理範圍，如 3 個字元)，減少無效查找
  const maxLength = Math.min(3, lastLineText.trim().length);
  const trimmedEnd = lastLineText.trim().slice(-maxLength);

  // 從最短的可能快捷鍵開始檢查
  for (let i = MIN_SHORTCUT_LENGTH; i <= maxLength; i++) {
    const candidate = trimmedEnd.slice(-i);
    if (!checkedCandidates.has(candidate)) {
      checkedCandidates.add(candidate);
      const result = await checkPromptCandidate(candidate);
      if (result) return result;
    }
  }

  return null;
}
// 去重和負面結果快取
const recentChecks = new Map<string, { timestamp: number; result: Prompt | null }>();
const CACHE_TTL = 2000; // 2秒快取
const MIN_SHORTCUT_LENGTH = 2; // 最小快捷鍵長度

async function checkPromptCandidate(candidate: string): Promise<Prompt | null> {
  // 檢查最小長度
  if (!candidate || candidate.length < MIN_SHORTCUT_LENGTH) {
    return null;
  }

  // 檢查去重快取
  const cached = recentChecks.get(candidate);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  // 先從本地快取查找
  const prompt = getPromptByShortcut(candidate);
  if (prompt) {
    const result = {
      shortcut: candidate,
      content: prompt.content,
      contentJSON: prompt.contentJSON,
      name: prompt.name,
    };

    // 更新快取
    recentChecks.set(candidate, { timestamp: Date.now(), result });
    return result;
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

    let result: Prompt | null = null;
    if (response?.data) {
      result = {
        shortcut: candidate,
        content: response.data.content,
        contentJSON: response.data.contentJSON,
        name: response.data.name,
      };
    }

    // 快取結果（包括負面結果）
    recentChecks.set(candidate, { timestamp: Date.now(), result });

    // 清理過期的快取
    const now = Date.now();
    for (const [key, value] of recentChecks.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        recentChecks.delete(key);
      }
    }

    return result;
  } catch (error) {
    console.error('取得提示失敗:', error);
    // 快取錯誤結果
    recentChecks.set(candidate, { timestamp: Date.now(), result: null });
    return null;
  }
}

async function processPromptInsertion(prompt: Prompt, element: HTMLElement, cursorInfo: CursorInfo) {
  if (!hasFormField(prompt)) {
    const shortcutStart = cursorInfo.textBeforeCursor.lastIndexOf(prompt.shortcut);
    if (shortcutStart === -1) return;

    const position = {
      start: shortcutStart,
      end: cursorInfo.start,
    };

    const result = await insertContentService({
      content: prompt.content,
      contentJSON: prompt.contentJSON as SupportedContent,
      targetElement: element,
      position,
      saveCursorPosition: true,
    });

    if (!result.success) {
      logger.error('Insert failed:', result.error);
    }
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

  try {
    // 檢查背景服務連線狀態
    if (!chrome.runtime?.id) {
      logger.error('Extension background service is not running');
      return;
    }

    // 發送創建視窗訊息並等待回應
    const response = await chrome.runtime.sendMessage({
      action: 'createWindow',
      title,
      content: prompt.content,
      contentJSON: prompt.contentJSON,
    });

    if (!response?.success) {
      logger.error('Failed to create form window:', response?.error || 'Unknown error');
    }
  } catch (error) {
    const errorMessage = (error as Error)?.message || '';
    logger.error('Failed to send createWindow message:', errorMessage);
  }
}
