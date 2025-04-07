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
// export async function insertTextAtCursor(text: string) {
//   const element = getDeepActiveElement();
//   if (!element) return false;

//   // 策略 1: 處理 <input> 或 <textarea>
//   if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
//     // 先確保聚焦
//     element.focus();
//     const start = element.selectionStart ?? 0;
//     const end = element.selectionEnd ?? start;

//     // 更新輸入框內容
//     element.value = element.value.slice(0, start) + text + element.value.slice(end);
//     const newCursorPos = start + text.length;

//     // 發送 input 與 change 事件
//     element.dispatchEvent(new Event('input', { bubbles: true }));
//     element.dispatchEvent(new Event('change', { bubbles: true }));

//     // 使用 requestAnimationFrame 延遲設定游標位置，等待瀏覽器重繪
//     requestAnimationFrame(() => {
//       element.focus();
//       element.setSelectionRange(newCursorPos, newCursorPos);
//     });
//     return true;
//   }
//   // 策略 2: 處理 contenteditable 元素
//   else if (element instanceof HTMLElement && element.isContentEditable) {
//     element.focus();
//     document.execCommand('insertText', false, text);
//     const selection = window.getSelection();
//     if (selection && selection.rangeCount > 0) {
//       const range = selection.getRangeAt(0);
//       range.collapse(false);
//       selection.removeAllRanges();
//       selection.addRange(range);
//     }
//     return true;
//   }
//   // 策略 3: 使用 Selection 和 Range API 做備用方案
//   else {
//     const selection = window.getSelection();
//     if (selection && selection.rangeCount > 0) {
//       const range = selection.getRangeAt(0);
//       range.deleteContents();
//       const textNode = document.createTextNode(text);
//       range.insertNode(textNode);
//       range.setStartAfter(textNode);
//       range.collapse(true);
//       selection.removeAllRanges();
//       selection.addRange(range);
//       if (element instanceof HTMLElement) {
//         element.focus();
//       }
//       return true;
//     }
//   }
//   return false;
// }

export async function insertTextAtCursor(text: string) {
  console.log('Beginning text insertion:', { text });
  const element = getDeepActiveElement();
  console.log('Active element:', element);

  if (!element) {
    console.warn('No active element found');
    return false;
  }
  // Store the original focus state
  const wasActive = document.activeElement === element;

  // 策略 1: 處理 <input> 或 <textarea>
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    console.log('Handling input/textarea insertion');
    element.focus();
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? start;

    try {
      // 使用 setRangeText 而不是直接修改 value
      element.setRangeText(text, start, end, 'end');

      // 觸發事件
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));

      console.log('Text inserted successfully in input/textarea');
      return true;
    } catch (error) {
      console.error('Error inserting text:', error);
      return false;
    }
  }
  // 策略 2: 處理 contenteditable 元素
  else if (element instanceof HTMLElement && element.isContentEditable) {
    console.log('Handling contenteditable insertion');
    element.focus();

    try {
      // Store selection state
      const selection = window.getSelection();
      const originalRange = selection?.getRangeAt(0).cloneRange();

      // Try using execCommand first
      const success = document.execCommand('insertText', false, text);

      if (!success) {
        console.log('ExecCommand failed, using fallback method');
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const textNode = document.createTextNode(text);

          // Insert the text
          range.deleteContents();
          range.insertNode(textNode);

          // Set cursor position after inserted text
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }

      // Ensure focus is maintained
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
      console.error('Error inserting text:', error);

      // Attempt to restore focus on error
      if (wasActive) {
        element.focus();
      }
    }
  }

  console.warn('No suitable insertion method found');
  return false;
}
