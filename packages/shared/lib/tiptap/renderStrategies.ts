/**
 * Form 節點渲染策略
 * 定義不同 Form 節點類型的顯示邏輯
 */

import type { FormNodeRenderStrategy } from './formNodeFactory';
import { getAttrValue } from '../form/utils';

/**
 * FormText 節點渲染策略
 * 顯示格式：[欄位名稱:預設值]
 */
export const formTextRenderStrategy: FormNodeRenderStrategy = attributes => {
  const name = getAttrValue(attributes, 'name') || 'field';
  const defaultValue = getAttrValue(attributes, 'default') || '';
  return `[${name}:${defaultValue}]`;
};

/**
 * FormMenu 節點渲染策略
 * 顯示格式：[選單名稱:預設值或第一個選項]
 */
export const formMenuRenderStrategy: FormNodeRenderStrategy = attributes => {
  const name = getAttrValue(attributes, 'name') || 'menu';
  const defaultValue = getAttrValue(attributes, 'default') || '';
  const options = (getAttrValue(attributes, 'options') as string[]) || [];

  // 顯示預設值或第一個選項
  const displayValue = defaultValue || (Array.isArray(options) && options[0]) || '';
  return `[${name}:${displayValue}]`;
};
