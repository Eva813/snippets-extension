// utils.ts

// 僅記錄游標位置無法區分這是哪個輸入元素的位置 ，下次插入時無法確定應該將內容插入到哪個輸入框
// ElementPath 可用來驗證目前聚焦的元素是否與記錄時相同，假如輸入框內已經有一段文字，而你需要在特定位置插入新內容，這時候需要記錄並定位該輸入框的位置。
export function generateElementPath(element: Element): string {
  const path: string[] = [];
  let current: Element | null = element;

  // 當 current 存在且不是 <body> 或 <html> 時，持續往父層遍歷
  while (current && current !== document.body && current !== document.documentElement) {
    // 取得當前元素的標籤名稱，轉成小寫作為基礎選擇器
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${current.id}`;
    } else if (current.classList.length > 0) {
      selector += `.${Array.from(current.classList).join('.')}`;
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(current);
      selector += `:nth-child(${index + 1})`;
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
  // 最終可能生成的字串：div#container > ul.list > li.item:nth-child(3)
}

/**
 * 檢查元素是否為可編輯元素
 */
export function isEditableElement(element: Element | null): boolean {
  return !!(
    element &&
    (element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      (element as HTMLElement).isContentEditable)
  );
}
