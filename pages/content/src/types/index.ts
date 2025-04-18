export interface Snippet {
  shortcut: string;
  content: string;
  name?: string;
}

export interface CursorInfo {
  start: number;
  end: number;
  textBeforeCursor: string;
  textAfterCursor: string;
}
