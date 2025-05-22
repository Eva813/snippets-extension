/**
 * 訊息事件介面
 */
export interface MessageEvent {
  action: string;
  [key: string]: unknown;
}

/**
 * prompt 片段快速鍵訊息介面
 */
export interface PromptShortcutMessage extends MessageEvent {
  /** 特定的 getPromptByShortcut 動作 */
  action: 'getPromptByShortcut';
  shortcut: string;
}

/**
 * prompt 片段回應介面
 */
export interface PromptResponse {
  prompt?: Prompt;
}

/**
 * prompt 片段型別定義
 */
export interface Prompt {
  id?: string;
  name: string;
  content: string;
  shortcut: string;
}

/**
 * 資料夾型別定義
 */
export interface Folder {
  id: string;
  name: string;
  prompts: Prompt[];
}
