/**
 * Form 相關的輔助函數
 */

import type { FormAttribute } from './types';

/** 從屬性陣列中提取指定名稱的值 */
export function getAttrValue(attributes: FormAttribute[], name: string): unknown {
  const attr = attributes.find(attr => attr.name === name);
  return attr?.value;
}

/** 安全地將值轉換為字串 */
export function getAttrStringValue(attributes: FormAttribute[], name: string, defaultValue = ''): string {
  const value = getAttrValue(attributes, name);
  return typeof value === 'string' ? value : defaultValue;
}

/** 安全地將值轉換為布林值 */
export function getAttrBooleanValue(attributes: FormAttribute[], name: string, defaultValue = false): boolean {
  const value = getAttrValue(attributes, name);
  return typeof value === 'boolean' ? value : defaultValue;
}

/** 安全地將值轉換為字串陣列 */
export function getAttrArrayValue(attributes: FormAttribute[], name: string, defaultValue: string[] = []): string[] {
  const value = getAttrValue(attributes, name);
  return Array.isArray(value) ? value : defaultValue;
}
