// textInserter.ts
import { insertIntoRange } from '@src/utils/insertIntoRange';
import { findTextRangeNodes } from '@src/utils/findTextRangeNodes';
import { generateElementPath } from '@src/utils/utils';
/**
 * 取得深層的 active element，並嘗試捕捉因點擊容器而非輸入框導致未聚焦正確元素的情況
 */
export function getDeepActiveElement(): Element | null {
  let active = document.activeElement;

  // 如果沒有有效的 active element 或者目前聚焦的是 body，
  // 可試著從 selection 中找尋可能的候選者
  if (!active || active === document.body) {
    const selection = window.getSelection();
    if (selection && selection.focusNode && selection.focusNode.parentElement) {
      active = selection.focusNode.parentElement;
    }
  }

  // 若 active 不是 input、textarea 或 contenteditable，嘗試尋找內部的可輸入元素
  if (
    active &&
    !(
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      (active as HTMLElement).isContentEditable
    )
  ) {
    let candidate: Element | null = null;
    // 若點擊的是 button，可能目標輸入框在其父層中
    if (active instanceof HTMLButtonElement) {
      candidate = active.parentElement?.querySelector('input, textarea, [contenteditable="true"]') || null;
    } else {
      candidate = active.querySelector('input, textarea, [contenteditable="true"]');
    }
    if (candidate) {
      (candidate as HTMLElement).focus();
      active = candidate;
    }
  }

  // 如果該元素有 shadowRoot，則進入內層
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  return active;
}

// 點擊側邊欄的按鈕時，會將文字插入到當前聚焦的輸入框中
export async function insertTextAtCursor(text: string, positionInfo?: { start: number; end: number }) {
  console.log('執行 insertTextAtCursor:', { text, positionInfo });
  const element = getDeepActiveElement();
  console.log('Active element:', element);

  if (!element) {
    console.warn('無法找到活動元素');
    return false;
  }
  // 儲存原始焦點狀態
  const wasActive = document.activeElement === element;

  // 策略 1: 處理 <input> 或 <textarea>
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.focus();

    // 如果有提供位址資訊，優先使用它
    const start = positionInfo?.start ?? element.selectionStart ?? 0;
    const end = positionInfo?.end ?? element.selectionEnd ?? start;

    try {
      // 使用 setRangeText 而不是直接修改 value
      element.setRangeText(text, start, end, 'end');

      // 計算並儲存新的游標位置
      const newPosition = start + text.length;

      // 更新儲存的游標位置資訊
      chrome.storage.local.set({
        cursorPosition: {
          start: newPosition,
          end: newPosition,
          elementPath: generateElementPath(element), // 新增此函式來記錄元素路徑
        },
      });

      console.log('更新游標位置:', newPosition);

      // 觸發事件
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));

      return true;
    } catch (error) {
      console.error('插入文字時發生錯誤:', error);
      return false;
    }
  }

  // 策略 2: 處理 contenteditable 元素
  if (element instanceof HTMLElement && element.isContentEditable) {
    // 如果有位址資訊，嘗試找到對應的範圍
    if (positionInfo) {
      try {
        const { startNode, endNode, startOffset, endOffset } = findTextRangeNodes(
          element,
          positionInfo.start,
          positionInfo.end,
        );

        if (startNode && endNode) {
          const range = document.createRange();
          range.setStart(startNode, startOffset);
          range.setEnd(endNode, endOffset);
          insertIntoRange(range, text);

          // 計算新的位置
          const newPosition = positionInfo.start + text.length;

          // 保存新的游標位置
          chrome.storage.local.set({
            cursorPosition: {
              start: newPosition,
              end: newPosition,
              elementPath: generateElementPath(element),
            },
          });

          console.log('更新 contenteditable 游標位置:', newPosition);
          return true;
        }
      } catch (error) {
        console.warn('無法使用位址資訊找到範圍，回到預設處理:', error);
      }
    }

    // 若無位址資訊或找不到範圍，使用預設方法
    element.focus();

    try {
      // 獲取當前的位置資訊
      const currentPosition = getCurrentContenteditablePosition(element);

      // 儲存選取狀態
      const selection = window.getSelection();
      const originalRange = selection?.getRangeAt(0).cloneRange();

      // 先嘗試使用 execCommand
      const success = document.execCommand('insertText', false, text);

      if (!success && selection && selection.rangeCount > 0) {
        console.warn('execCommand 失敗，改用 insertIntoRange');

        const fallbackRange = selection.getRangeAt(0);
        insertIntoRange(fallbackRange, text); // 使用共用工具函式
      }

      // 保存更新後的游標位置
      const newPosition = currentPosition + text.length;
      chrome.storage.local.set({
        cursorPosition: {
          start: newPosition,
          end: newPosition,
          elementPath: generateElementPath(element),
        },
      });

      console.log('更新 contenteditable 預設方法游標位置:', newPosition);

      // 確保保持焦點
      requestAnimationFrame(() => {
        element.focus();
        if (originalRange) {
          const newSelection = window.getSelection();
          if (newSelection) {
            newSelection.removeAllRanges();
            newSelection.addRange(originalRange);
          }
        }
      });

      return true;
    } catch (error) {
      console.error('插入文字時發生錯誤:', error);

      // 嘗試在錯誤時回復焦點
      if (wasActive) {
        element.focus();
      }
    }
  }

  console.warn('找不到合適的插入方法');
  return false;
}

// 取得 contenteditable 元素中的當前位置
function getCurrentContenteditablePosition(element: HTMLElement): number {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;

  const range = selection.getRangeAt(0);
  const preRange = document.createRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.startContainer, range.startOffset);

  return preRange.toString().length;
}
