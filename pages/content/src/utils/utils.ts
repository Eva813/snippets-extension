import DOMPurify from 'dompurify';
// utils.ts
export function stripHtml(html: string): string {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

export function convertTemplate(template: string): { convertedHtml: string; initialData: Record<string, string> } {
  console.log('convertedHtml:', template);
  const parser = new DOMParser();
  const doc = parser.parseFromString(template, 'text/html');
  const initialData: Record<string, string> = {};
  // 找到所有帶有 data-type="formtext" 的元素
  const fields = doc.querySelectorAll('[data-type="formtext"]');
  fields.forEach((elem, index) => {
    // 使用 label 屬性作為欄位 key，如果沒有，則用 index 補充
    const key = elem.getAttribute('label') || `field_${index}`;
    const defaultValue = elem.getAttribute('defaultvalue') || '';
    initialData[key] = defaultValue;
    // 建立 input 元件
    const input = doc.createElement('input');
    input.type = 'text';
    // 用 label 屬性作為 placeholder
    input.placeholder = key;
    input.value = defaultValue;
    input.name = key;
    // 可加入 onChange 事件，但這邊我們會在 popup 裡統一綁定
    // 將原先的 span 替換掉
    elem.parentNode?.replaceChild(input, elem);
  });
  console.log(' doc.body.innerHTML data:', doc.body.innerHTML);
  // 回傳轉換後的 innerHTML 與初始資料
  return { convertedHtml: doc.body.innerHTML, initialData };
}

export function parseHtml(content: string): HTMLElement | null {
  const cleanHTML = DOMPurify.sanitize(`<div>${content}</div>`);
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanHTML, 'text/html');
  return doc.body.firstElementChild as HTMLElement | null;
}
