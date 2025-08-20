/**
 * Form 節點類型常數
 *
 * 🎯 用途：統一管理所有表單節點類型，消除硬編碼
 * 📍 使用位置：檢測邏輯、TipTap 節點定義
 */

/** Form 節點類型常數 */
export const FORM_NODE_TYPES = {
  /** 文字輸入欄位 */
  TEXT: 'formtext',

  /** 下拉選單 */
  MENU: 'formmenu',
} as const;

/** Form 節點類型的聯合類型 */
export type FormNodeType = (typeof FORM_NODE_TYPES)[keyof typeof FORM_NODE_TYPES];

/** 取得所有 Form 節點類型 */
export function getAllFormNodeTypes(): FormNodeType[] {
  return [FORM_NODE_TYPES.TEXT, FORM_NODE_TYPES.MENU];
}

/** 檢查指定的類型是否為已知的 Form 節點 */
export function isFormNodeType(type: string): type is FormNodeType {
  return type === FORM_NODE_TYPES.TEXT || type === FORM_NODE_TYPES.MENU;
}
