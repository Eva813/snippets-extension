/**
 * TipTap JSON 轉換工具
 * 將 TipTap JSON 格式轉換為純文字或 HTML，統一管理轉換邏輯
 */

import { generateHTML } from '@tiptap/html';
import TipTapStarterKit from '@tiptap/starter-kit';
import TipTapTextStyle from '@tiptap/extension-text-style';
import TipTapTextAlign from '@tiptap/extension-text-align';
import { createFormNode } from './formNodeFactory';
import { formTextRenderStrategy, formMenuRenderStrategy } from './renderStrategies';
import { FORM_NODE_TYPES } from '../form/constants';
import { logger } from '../logging/logger';
import { sanitizeHTMLWithFallback } from '../utils/sanitizer';

// TipTap JSON 內容的型別定義
interface TipTapJSONContent {
  type: string;
  content?: TipTapJSONContent[];
  attrs?: Record<string, unknown>;
  text?: string;
  marks?: Array<{
    type: string;
    attrs?: Record<string, unknown>;
  }>;
}

// TipTap 文件的根節點型別
interface TipTapDocument {
  type: 'doc';
  content: TipTapJSONContent[];
}

// 聯合型別：支援的內容格式
export type SupportedContent = TipTapDocument | TipTapJSONContent | string | null | undefined;

// FormText 節點 - 使用工廠模式創建
const FormTextNode = createFormNode(FORM_NODE_TYPES.TEXT, formTextRenderStrategy);

// FormMenu 節點 - 使用工廠模式創建
const FormMenuNode = createFormNode(FORM_NODE_TYPES.MENU, formMenuRenderStrategy);

/**
 * 為什麼需要 FormTextNode 和 FormMenuNode？
 *
 * generateHTML() 函數需要對應的 Node 定義來處理 TipTap JSON 中的自定義節點：
 *
 * 1. 轉換流程：
 *    TipTap JSON: {"type": "formtext", "attrs": {"promptData": {...}}}
 *    ↓ generateHTML 查找 FormTextNode 定義
 *    ↓ 調用 FormTextNode.renderHTML() 使用 formTextRenderStrategy
 *    ↓ 生成 HTML: <span data-type="formtext">[name:value]</span>
 *    ↓ parseHtmlToText 轉換為純文字: [name:value]
 *
 * 2. 沒有對應 Node 定義的後果：
 *    - generateHTML 遇到未知節點類型會忽略或報錯
 *    - 表單節點無法正確轉換為可讀文字格式
 *
 * 3. Node 定義提供的關鍵功能：
 *    - renderHTML(): 定義如何將節點轉換為 HTML 元素
 *    - parseHTML(): 定義如何從 HTML 解析回 TipTap 節點
 *    - 屬性處理：處理節點的 attrs 數據
 */

// 與後台同步的 TipTap 擴展配置
const extensions = [
  TipTapStarterKit,
  TipTapTextStyle,
  TipTapTextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  FormTextNode,
  FormMenuNode,
  // 注意：不包含 FontSize
];

/**
 * 改進的 HTML 轉純文字函數
 * 使用 DOM 遍歷 + 智能處理用戶內容，自動解碼HTML實體
 *
 * 特殊處理：
 * - 瀏覽器會將某些用戶輸入當作無效HTML而過濾，如：
 *   - </.anything (無效結束標籤)
 *   - <?anything (XML處理指令)
 * - 我們在DOM解析前先保護這些內容，解析後再還原
 */
function parseHtmlToText(html: string): string {
  // 預處理：保護會被瀏覽器HTML解析器過濾的用戶內容
  //
  // 問題1：當用戶輸入如 "</.sdfsdf" 時，瀏覽器的innerHTML會將 "</"
  // 視為無效的結束標籤開始符號而忽略或過濾該內容
  //
  // 問題2：當用戶輸入如 "<?anything" 時，瀏覽器會將 "<?"
  // 視為XML處理指令而特殊處理或過濾該內容
  //
  // 解決方案：DOM解析前將這些模式替換為安全的佔位符，
  // 處理完成後再還原為原始用戶輸入
  //
  // 使用時間戳確保佔位符唯一性，避免與用戶內容衝突
  const timestamp = Date.now();
  const PROTECTED_END_DOT = `__PROTECTED_END_DOT_${timestamp}__`;
  const PROTECTED_QUESTION = `__PROTECTED_QUESTION_${timestamp}__`;

  // 更精確的正則：只在段落標籤內進行替換，避免跨段落匹配
  let protectedHtml = html.replace(/<p([^>]*)>(.*?)<\/\./g, `<p$1>$2${PROTECTED_END_DOT}`);
  protectedHtml = protectedHtml.replace(/<p([^>]*)>(.*?)<\?/g, `<p$1>$2${PROTECTED_QUESTION}`);

  // 類型安全檢查：確保DOM API可用
  if (typeof document === 'undefined') {
    throw new Error('DOM API not available in this environment');
  }

  const tempDiv = document.createElement('div');
  try {
    tempDiv.innerHTML = protectedHtml;
  } catch (error) {
    // 如果DOM解析失敗，回退到簡單的字符串處理
    console.warn('DOM parsing failed, falling back to string processing:', error);
    throw new Error('Failed to parse HTML content');
  }

  function traverse(node: globalThis.Node, parentTag?: string, depth: number = 0): string {
    if (node.nodeType === globalThis.Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (!text.trim()) return '';
      return text.trim();
    } else if (node.nodeType === globalThis.Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      switch (tagName) {
        case 'p': {
          const content = traverseChildren(node, tagName, depth);
          if (parentTag === 'li') {
            return content;
          }
          // 空段落產生空行效果
          if (!content.trim()) {
            return '\n\n';
          }
          // 有內容段落只換行
          return content.trim() + '\n';
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
        case 'strong':
        case 'b':
        case 'em':
        case 'i':
        case 'u':
        case 's':
        case 'span':
          // 格式化標籤只提取內容，不保留標籤結構
          return traverseChildren(node, tagName, depth);
        default: {
          const childContent = traverseChildren(node, tagName, depth);
          // 空的未知元素（如<wer>, <ifram>）重建為文本
          if (!childContent.trim()) {
            return `<${tagName}>`;
          }
          // 有內容的未知元素保持結構
          return `<${tagName}>${childContent}`;
        }
      }
    }
    return '';
  }

  function traverseChildren(node: globalThis.Node, parentTag?: string, depth: number = 0): string {
    const childResults = Array.from(node.childNodes).map(child => traverse(child, parentTag, depth));
    return childResults.join('');
  }

  // 直接處理 tempDiv 的子節點，避免包裝 div 標籤
  const childResults = Array.from(tempDiv.childNodes).map(child => traverse(child));
  const raw = childResults.join('');

  // 還原被保護的用戶內容
  // 將安全佔位符還原為原始的用戶輸入
  const restored = raw
    .replace(new RegExp(PROTECTED_END_DOT, 'g'), '</.')
    .replace(new RegExp(PROTECTED_QUESTION, 'g'), '<?');

  const final = restored.replace(/\n{3,}/g, '\n\n').trim();
  return final;
}

/**
 * 型別守衛：檢查是否為有效的 TipTap 文件格式
 */
function isTipTapDocument(content: unknown): content is TipTapDocument {
  return (
    typeof content === 'object' &&
    content !== null &&
    'type' in content &&
    content.type === 'doc' &&
    'content' in content &&
    Array.isArray(content.content)
  );
}

/**
 * 將 TipTap JSON 轉換為純文字
 * 用於插入到網頁的文字內容
 *
 * @param jsonContent TipTap JSON 內容
 * @returns 純文字字串
 */
export function convertTipTapToPlainText(jsonContent: SupportedContent): string {
  try {
    // 處理空值
    if (!jsonContent) {
      return '';
    }

    // 格式驗證
    if (isTipTapDocument(jsonContent)) {
      // 檢查內容完整性
      if (!jsonContent.content || !Array.isArray(jsonContent.content)) {
        logger.warn('TipTap JSON 缺少有效的 content 陣列:', JSON.stringify(jsonContent));
        return '';
      }

      // 生成 HTML 然後轉為純文字
      const html = generateHTML(jsonContent, extensions);
      const plainText = parseHtmlToText(html);
      return plainText;
    }

    // 如果是字串，直接使用現有的轉換邏輯
    if (typeof jsonContent === 'string') {
      return parseHtmlToText(jsonContent);
    }

    logger.warn('無效的 TipTap JSON 格式:', JSON.stringify(jsonContent));
    return '';
  } catch (error) {
    logger.error('TipTap JSON 轉純文字失敗:', error instanceof Error ? error.message : 'Unknown error');

    // 錯誤時嘗試 fallback 處理
    if (typeof jsonContent === 'string') {
      return parseHtmlToText(jsonContent);
    }

    return '';
  }
}

/**
 * 將 TipTap JSON 轉換為 HTML
 * 用於 Side Panel 預覽顯示
 *
 * @param jsonContent TipTap JSON 內容
 * @returns HTML 字串
 */
export function convertTipTapToHTML(jsonContent: SupportedContent): string {
  try {
    // 處理空值
    if (!jsonContent) {
      return '<p></p>';
    }

    // 格式驗證
    if (isTipTapDocument(jsonContent)) {
      // 檢查內容完整性
      if (!jsonContent.content || !Array.isArray(jsonContent.content)) {
        logger.warn('TipTap JSON 缺少有效的 content 陣列:', JSON.stringify(jsonContent));
        return '<p></p>';
      }

      // 直接生成 HTML
      const html = generateHTML(jsonContent, extensions);
      const result = html.trim() || '<p></p>';
      return result;
    }

    // 如果是字串，直接返回（假設已經是 HTML）
    if (typeof jsonContent === 'string') {
      return jsonContent.trim() || '<p></p>';
    }

    logger.warn('無效的 TipTap JSON 格式:', JSON.stringify(jsonContent));
    return '<p></p>';
  } catch (error) {
    logger.error('TipTap JSON 轉 HTML 失敗:', error instanceof Error ? error.message : 'Unknown error');
    return '<p></p>';
  }
}

/**
 * 智能內容格式檢測和轉換
 * 優先使用 JSON 格式，fallback 到 HTML 格式
 *
 * @param contentJSON TipTap JSON 內容
 * @param content HTML 內容（向後相容）
 * @returns 純文字字串
 */
export function getContentForInsertion(contentJSON?: SupportedContent, content?: string): string {
  // 優先使用 JSON 格式 (對應後台策略)
  if (contentJSON) {
    const plainText = convertTipTapToPlainText(contentJSON);
    if (plainText) {
      return plainText;
    }
  }

  // Fallback 到 HTML 格式
  if (content) {
    return parseHtmlToText(content);
  }

  return '';
}

/**
 * 智能內容格式檢測和轉換（HTML 輸出）
 * 優先使用 JSON 格式，fallback 到 HTML 格式
 *
 * @param contentJSON TipTap JSON 內容
 * @param content HTML 內容（向後相容）
 * @returns HTML 字串
 */
export function getContentForPreview(contentJSON?: SupportedContent, content?: string): string {
  // 優先使用 JSON 格式 (對應後台策略)
  if (contentJSON) {
    const html = convertTipTapToHTML(contentJSON);
    if (html && html !== '<p></p>') {
      return html;
    }
  }

  // Fallback 到 HTML 格式 - 使用安全清理防止 XSS
  if (content) {
    return sanitizeHTMLWithFallback(content, '<p></p>');
  }

  return '<p></p>';
}
