/**
 * 訊息事件介面
 */
export interface MessageEvent {
  action: string;
  [key: string]: unknown;
}

/**
 * snippet 片段快速鍵訊息介面
 */
export interface SnippetShortcutMessage extends MessageEvent {
  /** 特定的 getSnippetByShortcut 動作 */
  action: 'getSnippetByShortcut';
  shortcut: string;
}

/**
 * snippet 片段回應介面
 */
export interface SnippetResponse {
  snippet?: Snippet;
}

/**
 * snippet 片段型別定義
 */
export interface Snippet {
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
  snippets: Snippet[];
}
