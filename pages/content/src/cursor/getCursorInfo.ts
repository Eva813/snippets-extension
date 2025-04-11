export interface CursorInfo {
  start: number;
  end: number;
  textBeforeCursor: string;
  textAfterCursor: string;
}

// 獲取游標資訊
export function getCursorInfo(element: HTMLElement): CursorInfo {
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
    if (!selection || selection.rangeCount === 0) {
      return { start, end, textBeforeCursor, textAfterCursor };
    }

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
