import DOMPurify from 'dompurify';
import { getContentForPreview, type SupportedContent } from '@extension/shared/lib/tiptap/tiptapConverter';

// utils.ts

/**
 * 將 HTML 字串轉換為 DOM 元素
 * @param content HTML 字串內容
 * @returns 解析後的 HTML 元素
 */
function createHtmlElement(content: string): HTMLElement | null {
  const cleanHTML = DOMPurify.sanitize(`<div>${content}</div>`);
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanHTML, 'text/html');
  return doc.body.firstElementChild as HTMLElement | null;
}

/**
 * 解析 prompt 內容並轉換為 DOM 元素，專用於 FormRoot 顯示
 * @param contentJSON TipTap JSON 格式內容 (優先使用)
 * @param content HTML 字串格式內容 (向後相容)
 * @returns 解析後的 HTML 元素，用於 React 渲染
 */
export function parseContentForFormDisplay(contentJSON?: SupportedContent, content?: string): HTMLElement | null {
  // 使用轉換工具獲取適當的 HTML 內容
  const htmlContent = getContentForPreview(contentJSON, content);

  const result = createHtmlElement(htmlContent);

  return result;
}
