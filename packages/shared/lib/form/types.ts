/**
 * Form 相關的 TypeScript 類型定義
 */

/** 表單屬性的基本結構 */
export interface FormAttribute {
  name: string;
  value: unknown;
}

/** 表單提示資料結構 */
export interface FormPromptData {
  attributes: FormAttribute[];
  commandName?: string;
  type?: string;
}
