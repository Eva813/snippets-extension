// 訊息內容相關介面
export interface PromptData {
  content: string;
  contentJSON?: unknown;
  shortcut: string;
  name: string;
}

// 版本檢查相關介面
import type { VersionMismatchInfo } from './version';

// 統一的 Runtime 訊息類型定義
export type RuntimeMessage =
  // UI 相關
  | { action: 'createWindow'; title: string; content: string; contentJSON?: unknown }
  | { action: 'getPopupData' }
  | { action: 'submitForm'; finalOutput: string }
  | { action: 'openShortcutsPage' }

  // Prompt 相關
  | { action: 'sidePanelInsertPrompt'; prompt: PromptData }
  | { action: 'getPromptByShortcut'; shortcut: string }
  | { action: 'addToPromptBear'; selectedText: string; pageUrl?: string; pageTitle?: string }

  // 資料夾相關
  | { action: 'getFolders' }
  | { action: 'getSpaceFolders'; promptSpaceId: string }
  | { action: 'getSharedFolders' }
  | { action: 'getSharedFolderDetails'; folderId: string }
  | { action: 'refreshSharedFolders' }
  | { action: 'getPublicFolder'; shareToken: string }

  // Space 相關
  | { action: 'getPromptSpaces' }
  | { action: 'setDefaultSpace'; spaceId: string }
  | { action: 'invalidatePromptSpacesCache' }

  // 認證相關
  | { action: 'updateIcon'; hasFolders: boolean }
  | { action: 'updateUserStatusFromClient'; data: { status: 'loggedIn' | 'loggedOut' }; domain: string }
  | { action: 'userLoggedOut' }
  | { action: 'requestLogout'; reason?: string }

  // 版本檢查相關
  | { action: 'checkExtensionVersion' }
  | { action: 'notifyVersionMismatch'; versionInfo: VersionMismatchInfo };

// 提取特定 action 的訊息類型工具類型
export type ExtractMessage<T extends RuntimeMessage, A extends T['action']> = Extract<T, { action: A }>;

// 特定 action 的訊息類型別名（便於使用）
export type CreateWindowMessage = ExtractMessage<RuntimeMessage, 'createWindow'>;
export type GetPopupDataMessage = ExtractMessage<RuntimeMessage, 'getPopupData'>;
export type SubmitFormMessage = ExtractMessage<RuntimeMessage, 'submitForm'>;
export type SidePanelInsertPromptMessage = ExtractMessage<RuntimeMessage, 'sidePanelInsertPrompt'>;
export type OpenShortcutsPageMessage = ExtractMessage<RuntimeMessage, 'openShortcutsPage'>;

export type GetPromptByShortcutMessage = ExtractMessage<RuntimeMessage, 'getPromptByShortcut'>;
export type AddToPromptBearMessage = ExtractMessage<RuntimeMessage, 'addToPromptBear'>;

export type GetFoldersMessage = ExtractMessage<RuntimeMessage, 'getFolders'>;
export type GetSpaceFoldersMessage = ExtractMessage<RuntimeMessage, 'getSpaceFolders'>;
export type GetSharedFoldersMessage = ExtractMessage<RuntimeMessage, 'getSharedFolders'>;
export type GetSharedFolderDetailsMessage = ExtractMessage<RuntimeMessage, 'getSharedFolderDetails'>;
export type RefreshSharedFoldersMessage = ExtractMessage<RuntimeMessage, 'refreshSharedFolders'>;
export type GetPublicFolderMessage = ExtractMessage<RuntimeMessage, 'getPublicFolder'>;

export type GetPromptSpacesMessage = ExtractMessage<RuntimeMessage, 'getPromptSpaces'>;
export type SetDefaultSpaceMessage = ExtractMessage<RuntimeMessage, 'setDefaultSpace'>;
export type InvalidatePromptSpacesCacheMessage = ExtractMessage<RuntimeMessage, 'invalidatePromptSpacesCache'>;

export type UpdateIconMessage = ExtractMessage<RuntimeMessage, 'updateIcon'>;
export type UpdateUserStatusFromClientMessage = ExtractMessage<RuntimeMessage, 'updateUserStatusFromClient'>;
export type UserLoggedOutMessage = ExtractMessage<RuntimeMessage, 'userLoggedOut'>;
export type RequestLogoutMessage = ExtractMessage<RuntimeMessage, 'requestLogout'>;

export type CheckExtensionVersionMessage = ExtractMessage<RuntimeMessage, 'checkExtensionVersion'>;
export type NotifyVersionMismatchMessage = ExtractMessage<RuntimeMessage, 'notifyVersionMismatch'>;
