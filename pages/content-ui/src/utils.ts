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

export function recordCursorInfo() {
  const element = getDeepActiveElement();
  if (!element) {
    console.warn('無法取得 active element');
    return;
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? start;
    chrome.storage.local.set({ shortcutInfo: { position: { start, end } } });
  } else if (element instanceof HTMLElement && element.isContentEditable) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // 此處使用 range 的 startOffset 為 caret 位置
      const start = range.startOffset;
      const end = range.startOffset;
      chrome.storage.local.set({ shortcutInfo: { position: { start, end } } });
    }
  }
}
