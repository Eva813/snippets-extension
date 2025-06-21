/**
 * 統一的內容插入服務
 * 統一處理所有類型的內容插入
 */

import { parseHtmlToText, generateElementPath, isEditableElement } from '../utils/utils';
import { findTextRangeNodes } from '../utils/findTextRangeNodes';
import { insertIntoRange } from '../utils/insertIntoRange';
import { getDeepActiveElement } from '../utils/getDeepActiveElement';

export interface InsertionOptions {
  /** 要插入的 HTML 內容 */
  content: string;
  /** 目標元素（可選，默認使用當前活動元素） */
  targetElement?: HTMLElement;
  /** 插入位置資訊（可選，用於替換特定範圍的文字） */
  position?: {
    start: number;
    end: number;
  };
  /** 是否保存游標位置到 storage */
  saveCursorPosition?: boolean;
}

export interface InsertionResult {
  success: boolean;
  error?: string;
  newCursorPosition?: number;
}

/**
 * 統一的內容插入函式
 * 處理所有類型的元素（input、textarea、contentEditable）
 */
export async function insertContent(options: InsertionOptions): Promise<InsertionResult> {
  const { content, targetElement, position, saveCursorPosition = true } = options;

  // 1. 確定目標元素
  const element = targetElement || getDeepActiveElement();
  if (!element || !isEditableElement(element)) {
    return { success: false, error: '找不到可編輯的目標元素' };
  }

  // 2. 轉換內容
  const plainTextContent = parseHtmlToText(content);

  console.log('統一插入服務:', {
    content,
    plainTextContent,
    element: element.tagName,
    hasPosition: !!position,
  });

  try {
    let newCursorPosition: number;

    // 3. 根據元素類型選擇插入策略
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      newCursorPosition = await insertIntoInputElement(element, plainTextContent, position);
    } else if (element instanceof HTMLElement && element.isContentEditable) {
      newCursorPosition = await insertIntoContentEditable(element, plainTextContent, position);
    } else {
      return { success: false, error: '不支援的元素類型' };
    }

    // 4. 保存游標位置
    if (saveCursorPosition) {
      await chrome.storage.local.set({
        cursorPosition: {
          start: newCursorPosition,
          end: newCursorPosition,
          elementPath: generateElementPath(element),
        },
      });
    }

    return { success: true, newCursorPosition };
  } catch (error) {
    console.error('內容插入失敗:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * 處理 input/textarea 元素的插入
 */
async function insertIntoInputElement(
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string,
  position?: { start: number; end: number },
): Promise<number> {
  element.focus();

  const start = position?.start ?? element.selectionStart ?? 0;
  const end = position?.end ?? element.selectionEnd ?? start;

  // 使用 setRangeText 進行插入
  element.setRangeText(text, start, end, 'end');

  // 觸發事件通知框架更新
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));

  const newPosition = start + text.length;
  element.setSelectionRange(newPosition, newPosition);

  return newPosition;
}

/**
 * 處理 contentEditable 元素的插入
 */
async function insertIntoContentEditable(
  element: HTMLElement,
  text: string,
  position?: { start: number; end: number },
): Promise<number> {
  element.focus();

  console.log('contentEditable 插入:', {
    hasPosition: !!position,
    position,
    text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
  });

  if (position) {
    // 有位置資訊：替換指定範圍的內容
    return insertAtSpecificPosition(element, text, position);
  } else {
    // 無位置資訊：在當前游標位置插入
    return insertAtCurrentCursor(element, text);
  }
}

/**
 * 在 contentEditable 的指定位置插入內容
 */
async function insertAtSpecificPosition(
  element: HTMLElement,
  text: string,
  position: { start: number; end: number },
): Promise<number> {
  try {
    const { startNode, endNode, startOffset, endOffset } = findTextRangeNodes(element, position.start, position.end);

    if (!startNode || !endNode) {
      console.warn('無法找到指定位置的節點，fallback 到當前游標位置');
      return insertAtCurrentCursor(element, text);
    }

    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);

      // 使用 execCommand 確保換行正確處理
      const success = document.execCommand('insertText', false, text);

      if (!success) {
        console.warn('execCommand 失敗，使用 fallback 方法');
        insertIntoRange(range, text);
      }
    }

    return position.start + text.length;
  } catch (error) {
    console.warn('指定位置插入失敗，fallback 到當前游標位置:', error);
    return insertAtCurrentCursor(element, text);
  }
}

/**
 * 在 contentEditable 的當前游標位置插入內容
 */
async function insertAtCurrentCursor(element: HTMLElement, text: string): Promise<number> {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    // 沒有選擇範圍，將游標設置到元素末尾
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  // 計算當前位置
  const currentPosition = getCurrentContentEditablePosition(element);

  // 使用 execCommand 插入
  const success = document.execCommand('insertText', false, text);

  if (!success && selection && selection.rangeCount > 0) {
    console.warn('execCommand 失敗，使用 fallback 方法');
    const fallbackRange = selection.getRangeAt(0);
    insertIntoRange(fallbackRange, text);
  }

  return currentPosition + text.length;
}

/**
 * 獲取 contentEditable 元素中的當前游標位置
 */
function getCurrentContentEditablePosition(element: HTMLElement): number {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;

  const range = selection.getRangeAt(0);
  const preRange = document.createRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.startContainer, range.startOffset);

  return preRange.toString().length;
}
