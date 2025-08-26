import { getAllFormNodeTypes } from '../form/constants';

interface Prompt {
  content: string;
  contentJSON?: unknown;
  shortcut: string;
  name?: string;
}

/**
 * 檢查 prompt 是否包含表單欄位
 * 支援 JSON 和 HTML 格式的表單欄位檢測
 *
 * @param prompt - 要檢查的 prompt 對象
 * @returns 是否包含表單欄位
 *
 * @example
 * ```typescript
 * const needsForm = hasFormField(prompt);
 * if (needsForm) {
 *   // 觸發表單處理流程
 * }
 * ```
 */
export function hasFormField(prompt: Prompt): boolean {
  if (prompt.contentJSON) {
    // JSON 格式：動態檢測所有已註冊的 form 節點類型
    const jsonStr = JSON.stringify(prompt.contentJSON);
    return getAllFormNodeTypes().some(type => jsonStr.includes(`"type":"${type}"`));
  } else {
    // HTML 格式：檢查是否包含 data-prompt 屬性
    return prompt.content.includes('data-prompt');
  }
}

export type { Prompt };
