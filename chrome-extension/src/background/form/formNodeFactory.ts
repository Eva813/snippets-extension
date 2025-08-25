/**
 * TipTap Form Node 工廠
 * 使用工廠模式統一創建 Form 節點，消除重複代碼
 */

import { Node as TipTapNode } from '@tiptap/core';
import type { FormPromptData } from '@extension/shared/lib/form/types';

/** Form 節點渲染策略函數類型 */
export type FormNodeRenderStrategy = (attributes: FormPromptData['attributes']) => string;

/**
 * 創建 TipTap Form Node
 *
 * @param name 節點名稱
 * @param renderStrategy 渲染策略函數
 * @returns TipTap Node 定義
 *
 * @example
 * ```typescript
 * const FormTextNode = createFormNode('formtext', (attrs) => {
 *   const name = getAttrValue(attrs, 'name') || 'field';
 *   const defaultValue = getAttrValue(attrs, 'default') || '';
 *   return `[${name}:${defaultValue}]`;
 * });
 * ```
 */
export function createFormNode(name: string, renderStrategy: FormNodeRenderStrategy) {
  return TipTapNode.create({
    name,
    group: 'inline',
    inline: true,

    addAttributes() {
      return {
        promptData: { default: {} },
      };
    },

    parseHTML() {
      return [{ tag: `span[data-type="${name}"]` }];
    },

    renderHTML({ node }) {
      const promptData = (node.attrs.promptData as FormPromptData) || { attributes: [] };
      const attributes = promptData.attributes || [];

      // 使用提供的渲染策略生成顯示文字
      const displayText = renderStrategy(attributes);

      return [
        'span',
        {
          'data-type': name,
          'data-prompt': JSON.stringify({ attributes }),
        },
        displayText,
      ];
    },
  });
}
