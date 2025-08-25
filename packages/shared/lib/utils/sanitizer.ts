import DOMPurify from 'dompurify';

/**
 * 安全的 HTML 清理配置
 * 用於防止 XSS 攻擊，同時保留基本的文字格式化
 */
export const SAFE_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'span', 'div'],
  ALLOWED_ATTR: ['style'],
  ALLOWED_STYLES: ['font-weight', 'font-style', 'text-decoration'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  SANITIZE_DOM: true,
};

/**
 * 清理 HTML 內容以防止 XSS 攻擊
 * @param html 需要清理的 HTML 字串
 * @returns 清理後的安全 HTML 字串
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html.trim(), SAFE_CONFIG);
}

/**
 * 清理 HTML 內容並提供預設值
 * 專用於向後相容的 HTML fallback 場景
 * @param html 需要清理的 HTML 字串
 * @param fallback 預設值，默認為 '<p></p>'
 * @returns 清理後的安全 HTML 字串或預設值
 */
export function sanitizeHTMLWithFallback(html: string | undefined, fallback: string = '<p></p>'): string {
  if (!html || typeof html !== 'string') {
    return fallback;
  }

  const cleaned = sanitizeHTML(html);
  return cleaned || fallback;
}
