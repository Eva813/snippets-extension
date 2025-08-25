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
 * 內聯格式化標籤列表
 * 這些標籤應該被剝離，只保留文字內容
 * 優先要對應 tipTap 編輯器有的功能
 */
const FORMATTING_INLINE_TAGS = new Set(['strong', 'em', 'b', 'i', 'u', 'mark', 'sub', 'sup', 'small']);

/**
 * 簡單的 HTML 轉純文字函數（用於此模組內部）
 * 重用現有邏輯的簡化版本
 */
function parseHtmlToText(html: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

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
        default: {
          const childContent = traverseChildren(node, tagName, depth);

          // 如果是格式化標籤，只返回內容（剝離標籤）
          if (FORMATTING_INLINE_TAGS.has(tagName)) {
            return childContent;
          }

          // 用戶標記保持原樣（開放標籤 + 內容）
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
  const final = raw.replace(/\n{3,}/g, '\n\n').trim();
  return final;
}

// function parseHtmlToText(html: string): string {
//     // 直接處理原始 HTML 字符串，不使用 DOM 解析
//     // 這樣可以保留所有原始內容，包括不完整的標籤如 <234234

//     let result = html;

//     // 將 <p> 標籤轉換為換行
//     result = result.replace(/<\/p>/gi, '\n');
//     result = result.replace(/<p[^>]*>/gi, '');

//     // 將 <br> 標籤轉換為換行
//     result = result.replace(/<br\s*\/?>/gi, '\n');

//     // 清理多餘的換行（3個或以上變成2個）
//     result = result.replace(/\n{3,}/g, '\n\n');

//     // 清理前後空白
//     result = result.trim();

//     return result;
//   }

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
