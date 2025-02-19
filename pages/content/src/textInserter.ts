// textInserter.ts

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

/**
 * 將指定文字插入目前聚焦的輸入框中，並移動 cursor 至插入文字之後
 */
export async function insertTextAtCursor(text: string) {
  const element = getDeepActiveElement();
  if (!element) return false;

  // 策略 1: 處理 <input> 或 <textarea>
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    // 先確保聚焦
    element.focus();
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? start;

    // 更新輸入框內容
    element.value = element.value.slice(0, start) + text + element.value.slice(end);
    const newCursorPos = start + text.length;

    // 發送 input 與 change 事件
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    // 使用 requestAnimationFrame 延遲設定游標位置，等待瀏覽器重繪
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(newCursorPos, newCursorPos);
    });
    return true;
  }
  // 策略 2: 處理 contenteditable 元素
  else if (element instanceof HTMLElement && element.isContentEditable) {
    element.focus();
    document.execCommand('insertText', false, text);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    return true;
  }
  // 策略 3: 使用 Selection 和 Range API 做備用方案
  else {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      if (element instanceof HTMLElement) {
        element.focus();
      }
      return true;
    }
  }
  return false;
}
