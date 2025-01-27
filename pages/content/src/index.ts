// import { toggleTheme } from '@src/toggleTheme';

console.log('content script loaded');

//void toggleTheme();

const snippets = [
  { shortcut: '/er', content: 'Example content for /er HII' },
  { shortcut: '/do', content: 'Example content for /do' },
  // 添加更多 snippets
];

// document.addEventListener('input', (event) => {
//   console.log('input event');
//   const target = event.target as HTMLInputElement | HTMLTextAreaElement;
//   if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
//     const value = target.value;
//     const snippet = snippets.find(s => value.endsWith(s.shortcut));
//     if (snippet) {
//       // 顯示 dialog
//       showDialog(snippet, target);
//     }
//   }
// });

// document.addEventListener('keyup', (event) => {
//   console.log(event)
//   const target = event.target as HTMLInputElement | HTMLTextAreaElement;
//   console.log('ddd', target)

//   // 檢查當前焦點是否在輸入框或文本區域
//   if (target) {
//     console.log('Current active element:', target);
//     const textInput = target.innerText || target.textContent || '';

//     // 日誌輸出以檢查事件是否被觸發
//     console.log('Keydown event triggered');
//     console.log('Current input value:', textInput);

//     // 檢查是否有符合的 snippet
//     const snippet = snippets.find(s => textInput.endsWith(s.shortcut));
//     if (snippet) {
//       console.log('Found snippet:', snippet);
//       showDialog(snippet, target);
//     }
//   }
// });

// document.addEventListener('input', (event) => {
//   const target = event.target as HTMLElement;
//   console.log('target listenner', target)
//   if (isEditableElement(target)) {
//     const textInput = getTextInput(target);
//     console.log('textInput', textInput)
//     const snippet = snippets.find(s => textInput.endsWith(s.shortcut));
//     console.log('snippet find', snippet)
//     if (snippet) {
//       // if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
//       console.log('show dialog')
//       showDialog(snippet, target as HTMLInputElement | HTMLTextAreaElement);
//     }
//     // }
//   }
// });

document.addEventListener('input', inputEventListener);

function inputEventListener(event: Event) {
  const target = event.target as HTMLElement;
  if (isEditableElement(target)) {
    const textInput = getTextInput(target);
    const snippet = snippets.find(s => textInput.endsWith(s.shortcut));
    if (snippet) {
      showDialog(snippet, target as HTMLInputElement | HTMLTextAreaElement);
    }
  }
}

function isEditableElement(target: EventTarget): target is HTMLElement {
  // 偵測瀏覽器輸入框、文本區域、可編輯元素
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  );
}

function getTextInput(target: HTMLElement): string {
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    return (target as HTMLInputElement | HTMLTextAreaElement).value;
  } else if (target.isContentEditable) {
    return target.innerText || target.textContent || '';
  }
  return '';
}

//加入樣式，以及對話框
const style = document.createElement('style');
style.innerHTML = `
  .dialog-content {
    color: black !important; /* 使用 !important 確保這條規則生效 */
    font-family: Arial, sans-serif;
    background: white;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;
document.head.appendChild(style);

function showDialog(snippet: { shortcut: string; content: string }, target: HTMLInputElement | HTMLTextAreaElement) {
  console.log('show dialog', snippet, target);
  const dialog = document.createElement('div');
  dialog.style.position = 'fixed';
  dialog.style.top = '50%';
  dialog.style.left = '50%';
  dialog.style.transform = 'translate(-50%, -50%)';
  dialog.style.zIndex = '10000';

  dialog.innerHTML = `
    <div class="dialog-content">
      <p>${snippet.content}</p>
      <button id="insert-button" style="margin-right: 10px;">Insert</button>
      <button id="cancel-button">Cancel</button>
    </div>
  `;

  document.body.appendChild(dialog);

  // 插入和取消按鈕事件
  document.getElementById('insert-button')!.addEventListener('click', () => {
    console.log('insert button iii', snippet.content);
    insertContent(snippet.shortcut, target);
    document.body.removeChild(dialog);
  });

  document.getElementById('cancel-button')!.addEventListener('click', () => {
    document.body.removeChild(dialog);
  });
}

// function insertContent(content: string, target: HTMLInputElement | HTMLTextAreaElement) {
//   const value = target.value;
//   const snippet = snippets.find(s => value.endsWith(s.shortcut))!;
//   target.value = value.replace(snippet.shortcut, content);
// }

function insertContent(shortcut: string, target: HTMLElement) {
  let value: string = '';
  // 判斷目標是輸入框、文本區域或 contentEditable 元素
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    value = target.value;
  } else if (target.isContentEditable) {
    value = target.innerText || target.textContent || '';
  }

  console.log('insert short', value);

  // 確保 value 是有效的字符串
  if (typeof value !== 'string' || !value) {
    console.warn('Invalid input value:', value);
    return;
  }

  // 找到對應的 snippet
  const snippet = snippets.find(s => value.endsWith(s.shortcut));

  if (snippet) {
    document.removeEventListener('input', inputEventListener);

    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      // 處理輸入框和文本區域
      const cursorPosition = target.selectionStart ?? value.length;
      const beforeShortcut = value.substring(0, cursorPosition - shortcut.length);
      const afterShortcut = value.substring(cursorPosition);
      // 將 shortcut 替換為 content
      console.log('beforeShortcut', beforeShortcut);
      target.value = beforeShortcut + snippet.content + afterShortcut;

      // 移動光標到插入內容的結尾
      const newCursorPosition = beforeShortcut.length + snippet.content.length;
      target.setSelectionRange(newCursorPosition, newCursorPosition);
      console.log('inserted content', target.value);
    } else if (target.isContentEditable) {
      // 處理 contentEditable 元素
      insertContentToEditableElement(snippet.content, target);
    }
    document.addEventListener('input', inputEventListener);
  } else {
    console.warn('No matching snippet found for shortcut:', shortcut);
  }
}

// 有插入。但沒有去除原本的快捷鍵
function insertContentToEditableElement(content: string, target: HTMLElement) {
  const selection = window.getSelection();
  console.log('selection', selection);
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    console;
    range.deleteContents(); // 刪除選中的文字
    const textNode = document.createTextNode(content);
    range.insertNode(textNode);
    range.setStartAfter(textNode); // 將光標移動到插入內容的末尾
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    target.focus(); // 使用 target 使其獲得焦點
  }
}
