export interface Prompt {
  shortcut: string;
  content: string; // HTML (向後相容)
  contentJSON?: unknown; // JSON (新格式) - 使用 unknown 避免複雜的型別導入
  name?: string;
}

export interface CursorInfo {
  start: number;
  end: number;
  textBeforeCursor: string;
  textAfterCursor: string;
}
