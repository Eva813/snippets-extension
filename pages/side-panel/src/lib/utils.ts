import DOMPurify from 'dompurify';
import {
  getContentForPreview,
  type SupportedContent,
} from '../../../../chrome-extension/src/background/utils/tiptapConverter';

// utils.ts
export function stripHtml(html: string): string {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

export function parseHtml(content: string): HTMLElement | null {
  const cleanHTML = DOMPurify.sanitize(`<div>${content}</div>`);
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanHTML, 'text/html');
  return doc.body.firstElementChild as HTMLElement | null;
}

/**
 * 智能內容解析 - 支援 JSON 和 HTML 格式
 * @param contentJSON TipTap JSON 內容 (新格式)
 * @param content HTML 內容 (向後相容)
 * @returns 解析後的 HTML 元素
 */
export function parseContent(contentJSON?: SupportedContent, content?: string): HTMLElement | null {
  console.log('🔄 parseContent 調用:', { contentJSON, content });

  // 使用轉換工具獲取適當的 HTML 內容
  const htmlContent = getContentForPreview(contentJSON, content);
  console.log('📄 parseContent HTML 輸出:', htmlContent);

  const result = parseHtml(htmlContent);
  console.log('🎯 parseContent 最終結果:', result);

  return result;
}
