import DOMPurify from 'dompurify';
// utils.ts
export function stripHtml(html: string): string {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

// 將 HTML 轉換為結構化純文字的函式
export function parseHtmlToText(html: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  console.log('tempDiv.innerHTML:', tempDiv.innerHTML);

  function traverse(node: Node, parentTag?: string, depth: number = 0): string {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (!text.trim()) return '';
      return text.trim();
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      switch (tagName) {
        case 'p': {
          const content = traverseChildren(node, tagName, depth);
          if (parentTag === 'li') {
            return content;
          }
          if (!content.trim()) {
            return '\n';
          }
          return content + '\n';
        }
        case 'ul':
          return traverseChildren(node, tagName, depth + 1);
        case 'li': {
          // 根據深度加入縮排空格
          const indent = '  '.repeat(depth);
          return `${indent}` + traverseChildren(node, tagName, depth) + '\n';
        }
        case 'br':
          return '\n';
        default:
          return traverseChildren(node, tagName, depth);
      }
    }
    return '';
  }

  function traverseChildren(node: Node, parentTag?: string, depth: number = 0): string {
    return Array.from(node.childNodes)
      .map(child => traverse(child, parentTag, depth))
      .join('');
  }

  const raw = traverse(tempDiv);
  return raw.replace(/\n{3,}/g, '\n\n').trim();
}

// export function convertTemplate(template: string): { convertedHtml: string; initialData: Record<string, string> } {
//   console.log('convertedHtml:', template);
//   const parser = new DOMParser();
//   const doc = parser.parseFromString(template, 'text/html');
//   const initialData: Record<string, string> = {};
//   // 找到所有帶有 data-type="formtext" 的元素
//   const fields = doc.querySelectorAll('[data-type="formtext"]');
//   fields.forEach((elem, index) => {
//     // 使用 label 屬性作為欄位 key，如果沒有，則用 index 補充
//     const key = elem.getAttribute('label') || `field_${index}`;
//     const defaultValue = elem.getAttribute('defaultvalue') || '';
//     initialData[key] = defaultValue;
//     // 建立 input 元件
//     const input = doc.createElement('input');
//     input.type = 'text';
//     // 用 label 屬性作為 placeholder
//     input.placeholder = key;
//     input.value = defaultValue;
//     input.name = key;
//     // 可加入 onChange 事件，但這邊我們會在 popup 裡統一綁定
//     // 將原先的 span 替換掉
//     elem.parentNode?.replaceChild(input, elem);
//   });
//   console.log(' doc.body.innerHTML data:', doc.body.innerHTML);
//   // 回傳轉換後的 innerHTML 與初始資料
//   return { convertedHtml: doc.body.innerHTML, initialData };
// }

export function parseHtml(content: string): HTMLElement | null {
  const cleanHTML = DOMPurify.sanitize(`<div>${content}</div>`);
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanHTML, 'text/html');
  return doc.body.firstElementChild as HTMLElement | null;
}

// 僅記錄游標位置無法區分這是哪個輸入元素的位置 ，下次插入時無法確定應該將內容插入到哪個輸入框
// ElementPath 可用來驗證目前聚焦的元素是否與記錄時相同
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
 * @param element 要檢查的元素
 * @returns 是否為可編輯元素
 */
export function isEditableElement(element: Element | null): boolean {
  return !!(
    element &&
    (element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      (element as HTMLElement).isContentEditable)
  );
}
