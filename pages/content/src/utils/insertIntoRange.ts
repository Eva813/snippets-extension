/**
 * 將文字插入到指定 Range 中，避免 execCommand
 * @param range 要插入內容的 DOM Range
 * @param plainText 欲插入的純文字
 * @param htmlText 可選的 HTML 內容（用於富文字編輯器）
 * @returns 是否成功插入
 */
export function insertIntoRange(range: Range, plainText: string, htmlText?: string): boolean {
  try {
    const selection = window.getSelection();
    if (!selection) {
      console.warn('無法取得選取範圍');
      return false;
    }

    // 檢查 range 是否有效
    if (!range || range.collapsed === undefined) {
      console.warn('無效的 Range 物件');
      return false;
    }

    // 選取指定範圍
    selection.removeAllRanges();
    selection.addRange(range);

    // 方法 1: 使用現代的 InputEvent API（如果支援的話）
    const targetElement =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as Element)
        : range.commonAncestorContainer.parentElement;

    if (targetElement && typeof InputEvent !== 'undefined') {
      try {
        // 建立 InputEvent 來模擬使用者輸入
        const inputEvent = new InputEvent('beforeinput', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: plainText,
        });

        // 觸發事件，讓頁面的 React 等框架處理
        if (targetElement.dispatchEvent(inputEvent)) {
          // 如果事件沒有被取消，執行實際插入
          range.deleteContents();
          const textNode = document.createTextNode(plainText);
          range.insertNode(textNode);

          // 設定游標位置
          range.setStartAfter(textNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);

          // 觸發 input 事件通知變更
          const changeEvent = new InputEvent('input', {
            bubbles: true,
            inputType: 'insertText',
            data: plainText,
          });
          targetElement.dispatchEvent(changeEvent);

          return true;
        }
      } catch (inputEventError) {
        console.warn('InputEvent 方式失敗:', inputEventError);
      }
    }

    // 方法 2: 直接 DOM 操作（主要方法）
    try {
      range.deleteContents();

      // 決定插入純文字還是 HTML
      if (htmlText && targetElement && (targetElement as HTMLElement).isContentEditable) {
        // 對於富文字編輯器，嘗試插入 HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlText;

        // 將 HTML 內容轉換為 DocumentFragment
        const fragment = document.createDocumentFragment();
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild);
        }

        range.insertNode(fragment);

        // 移動游標到插入內容之後
        range.collapse(false);
      } else {
        // 檢查是否為 contentEditable 元素且文字包含換行
        if (targetElement && (targetElement as HTMLElement).isContentEditable && plainText.includes('\n')) {
          // 對於 contentEditable，將換行符轉換為 <br> 標籤
          const lines = plainText.split('\n');
          const fragment = document.createDocumentFragment();

          lines.forEach((line, index) => {
            if (line.length > 0) {
              fragment.appendChild(document.createTextNode(line));
            }
            // 除了最後一行，都添加 <br> 標籤
            if (index < lines.length - 1) {
              fragment.appendChild(document.createElement('br'));
            }
          });

          range.insertNode(fragment);
        } else {
          // 一般情況插入純文字
          const textNode = document.createTextNode(plainText);
          range.insertNode(textNode);
        }

        // 移動游標到插入內容之後
        range.setStartAfter(range.endContainer);
        range.collapse(true);
      }

      // 更新選取範圍
      selection.removeAllRanges();
      selection.addRange(range);

      return true;
    } catch (domError) {
      console.error('DOM 插入失敗:', domError);
    }

    // 方法 3: 最後的 fallback - 使用 execCommand（但僅在必要時）
    try {
      // 檢查是否支援 insertText 指令
      if (document.queryCommandSupported?.('insertText')) {
        console.warn('使用 execCommand fallback');
        selection.removeAllRanges();
        selection.addRange(range);

        const success = document.execCommand('insertText', false, plainText);
        if (success) {
          return true;
        }
      }
    } catch (execError) {
      console.warn('execCommand fallback 也失敗:', execError);
    }

    return false;
  } catch (error) {
    console.error('insertIntoRange 完全失敗:', error);
    return false;
  }
}
