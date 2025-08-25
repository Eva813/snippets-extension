/**
 * TipTap 相關模組匯出
 * 統一管理 TipTap 轉換和 Form 節點功能
 */

export { createFormNode } from './formNodeFactory';
export type { FormNodeRenderStrategy } from './formNodeFactory';
export { formTextRenderStrategy, formMenuRenderStrategy } from './renderStrategies';
export {
  convertTipTapToPlainText,
  convertTipTapToHTML,
  getContentForInsertion,
  getContentForPreview,
} from './tiptapConverter';
export type { SupportedContent } from './tiptapConverter';
