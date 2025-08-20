/**
 * 後台 TipTap JSON 轉換工具
 * 將 TipTap JSON 格式轉換為純文字或 HTML，與後台格式同步
 */

import { generateHTML } from '@tiptap/html';
import TipTapStarterKit from '@tiptap/starter-kit';
import TipTapTextStyle from '@tiptap/extension-text-style';
import TipTapTextAlign from '@tiptap/extension-text-align';
import { createFormNode, formTextRenderStrategy, formMenuRenderStrategy } from '../form';
import { FORM_NODE_TYPES } from '@extension/shared/lib/form/constants';

// 開發環境 logging 工具
const isDev = process.env.NODE_ENV === 'development' || typeof process === 'undefined' || process.env.__DEV__;
const devLog = {
  log: (...args: unknown[]): void => {
    if (isDev) console.log(...args);
  },
  warn: (...args: unknown[]): void => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    if (isDev) console.error(...args);
  },
};

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
 * 簡單的 HTML 轉純文字函數（用於此模組內部）
 * 重用現有邏輯的簡化版本
 */
function parseHtmlToText(html: string): string {
  devLog.log('🔍 parseHtmlToText called with HTML:', { html, length: html.length });
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  devLog.log('📋 Created tempDiv with childNodes:', tempDiv.childNodes.length);

  function traverse(node: globalThis.Node, parentTag?: string, depth: number = 0): string {
    devLog.log('🔍 Traversing node:', {
      nodeType: node.nodeType,
      nodeName: node.nodeName,
      textContent: node.textContent?.slice(0, 50),
    });

    if (node.nodeType === globalThis.Node.TEXT_NODE) {
      const text = node.textContent || '';
      devLog.log('📝 Processing text node:', { text: text.slice(0, 50), trimmed: text.trim().slice(0, 50) });
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
        default:
          return traverseChildren(node, tagName, depth);
      }
    }
    return '';
  }

  function traverseChildren(node: globalThis.Node, parentTag?: string, depth: number = 0): string {
    const childResults = Array.from(node.childNodes).map(child => traverse(child, parentTag, depth));
    devLog.log('👶 Child results:', childResults);
    return childResults.join('');
  }

  const raw = traverse(tempDiv);
  const final = raw.replace(/\n{3,}/g, '\n\n').trim();
  devLog.log('📤 parseHtmlToText final result:', {
    raw: raw.slice(0, 100),
    final: final.slice(0, 100),
    finalLength: final.length,
  });
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
  devLog.log('🔍 convertTipTapToPlainText called with:', jsonContent);

  try {
    // 處理空值
    if (!jsonContent) {
      devLog.log('⚠️ convertTipTapToPlainText: jsonContent is empty');
      return '';
    }

    // 格式驗證
    if (isTipTapDocument(jsonContent)) {
      devLog.log('✅ Valid TipTap document detected');

      // 檢查內容完整性
      if (!jsonContent.content || !Array.isArray(jsonContent.content)) {
        devLog.warn('❌ TipTap JSON 缺少有效的 content 陣列:', jsonContent);
        return '';
      }

      // 生成 HTML 然後轉為純文字
      devLog.log('🔄 Generating HTML from TipTap JSON...');
      const html = generateHTML(jsonContent, extensions);
      devLog.log('📄 Generated HTML:', html);

      const plainText = parseHtmlToText(html);
      devLog.log('📝 Converted to plain text:', plainText);

      return plainText;
    }

    // 如果是字串，直接使用現有的轉換邏輯
    if (typeof jsonContent === 'string') {
      devLog.log('📝 Processing as HTML string');
      return parseHtmlToText(jsonContent);
    }

    devLog.warn('❌ 無效的 TipTap JSON 格式:', jsonContent);
    return '';
  } catch (error) {
    devLog.error('💥 TipTap JSON 轉純文字失敗:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      content: jsonContent,
      timestamp: new Date().toISOString(),
    });

    // 錯誤時嘗試 fallback 處理
    if (typeof jsonContent === 'string') {
      devLog.log('🔄 Fallback to HTML processing');
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
  devLog.log('🔧 convertTipTapToHTML 調用:', jsonContent);

  try {
    // 處理空值
    if (!jsonContent) {
      devLog.log('⚠️ convertTipTapToHTML: 內容為空');
      return '<p></p>';
    }

    // 格式驗證
    if (isTipTapDocument(jsonContent)) {
      devLog.log('✅ 有效的 TipTap 文件格式');

      // 檢查內容完整性
      if (!jsonContent.content || !Array.isArray(jsonContent.content)) {
        devLog.warn('❌ TipTap JSON 缺少有效的 content 陣列:', jsonContent);
        return '<p></p>';
      }

      devLog.log('🔄 開始生成 HTML，content 長度:', jsonContent.content.length);
      devLog.log('📋 使用的 extensions:', extensions.length, '個');

      // 直接生成 HTML
      const html = generateHTML(jsonContent, extensions);
      devLog.log('📤 generateHTML 結果:', html);

      const result = html.trim() || '<p></p>';
      devLog.log('✅ convertTipTapToHTML 最終結果:', result);
      return result;
    }

    // 如果是字串，直接返回（假設已經是 HTML）
    if (typeof jsonContent === 'string') {
      devLog.log('📝 處理為 HTML 字串');
      return jsonContent.trim() || '<p></p>';
    }

    devLog.warn('❌ 無效的 TipTap JSON 格式:', jsonContent);
    return '<p></p>';
  } catch (error) {
    devLog.error('💥 TipTap JSON 轉 HTML 失敗:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      content: jsonContent,
      timestamp: new Date().toISOString(),
    });

    // 錯誤時回傳安全的預設 HTML
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
  devLog.log('🎯 getContentForInsertion called with:', {
    contentJSON: !!contentJSON,
    contentJSONType: typeof contentJSON,
    content: !!content,
    contentPreview: content?.slice(0, 100),
  });

  // 優先使用 JSON 格式 (對應後台策略)
  if (contentJSON) {
    devLog.log('⚡ Processing JSON content...');
    const plainText = convertTipTapToPlainText(contentJSON);
    devLog.log('📤 JSON conversion result:', { plainText, length: plainText.length });

    if (plainText) {
      devLog.log('✅ Using JSON-converted plain text');
      return plainText;
    } else {
      devLog.log('⚠️ JSON conversion returned empty, will fallback to HTML');
    }
  }

  // Fallback 到 HTML 格式
  if (content) {
    devLog.log('🔄 Fallback to HTML content');
    const htmlText = parseHtmlToText(content);
    devLog.log('📤 HTML conversion result:', { htmlText, length: htmlText.length });
    return htmlText;
  }

  devLog.log('❌ No content available for insertion');
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
  devLog.log('⚡ getContentForPreview 調用:', {
    hasContentJSON: !!contentJSON,
    contentJSONType: typeof contentJSON,
    hasContent: !!content,
  });

  // 優先使用 JSON 格式 (對應後台策略)
  if (contentJSON) {
    devLog.log('🔍 使用 JSON 格式轉換...', contentJSON);
    const html = convertTipTapToHTML(contentJSON);
    devLog.log('📋 JSON 轉換結果:', html);
    if (html && html !== '<p></p>') {
      devLog.log('✅ 使用 JSON 轉換的 HTML');
      return html;
    } else {
      devLog.log('⚠️ JSON 轉換結果為空或預設值，嘗試 fallback');
    }
  }

  // Fallback 到 HTML 格式
  if (content) {
    devLog.log('🔄 使用 HTML 格式 (fallback):', content);
    return content.trim() || '<p></p>';
  }

  devLog.log('❌ 沒有可用的內容，返回預設值');
  return '<p></p>';
}
