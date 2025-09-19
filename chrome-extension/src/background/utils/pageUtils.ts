import { PAGE_TITLE_CONFIG, TITLE_SUFFIXES_TO_REMOVE } from './constants';

/**
 * 清理和縮短頁面標題
 */
export function sanitizePageTitle(title: string): string {
  if (!title || !title.trim()) {
    return PAGE_TITLE_CONFIG.FALLBACK;
  }

  let cleanTitle = title.trim();

  // 移除常見的網站後綴和行銷用語
  TITLE_SUFFIXES_TO_REMOVE.forEach(suffix => {
    cleanTitle = cleanTitle.replace(suffix, '');
  });

  // 移除多餘的標點符號和空白
  cleanTitle = cleanTitle
    .replace(/\s+/g, ' ')
    .replace(/[|\-–—]\s*$/, '')
    .trim();

  // 如果清理後為空，使用原標題的前段
  if (!cleanTitle) {
    cleanTitle = title.trim();
  }

  // 截斷到最大長度
  if (cleanTitle.length > PAGE_TITLE_CONFIG.MAX_LENGTH) {
    cleanTitle = cleanTitle.substring(0, PAGE_TITLE_CONFIG.MAX_LENGTH - 3) + '...';
  }

  return cleanTitle || PAGE_TITLE_CONFIG.FALLBACK;
}
