/**
 * 將文字或 HTML 插入到指定 Range 中
 * @param range 要插入內容的 DOM Range
 * @param plainText 欲插入的純文字（預設使用）
 * @param htmlText 若 execCommand 失敗，則作為 HTML fallback 插入
 * @returns 是否成功插入
 */
export function insertIntoRange(range: Range, plainText: string, htmlText?: string): boolean {
  const selection = window.getSelection();
  if (!selection) return false;

  // 選取指定範圍
  selection.removeAllRanges();
  selection.addRange(range);

  // 嘗試使用 execCommand 插入純文字
  const success = document.execCommand('insertText', false, plainText);

  if (!success && htmlText) {
    // execCommand 失敗，fallback 插入 HTML
    range.deleteContents();

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlText;

    const fragment = document.createDocumentFragment();
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
    }

    range.insertNode(fragment);
    range.collapse(false); // 游標移到末尾

    selection.removeAllRanges();
    selection.addRange(range);
  }

  return true;
}
