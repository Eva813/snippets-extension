// Initial state constants
export const INITIAL_SPACE_ID = '__initial__';

// Chrome runtime actions
export const CHROME_ACTIONS = {
  GET_PROMPT_SPACES: 'getPromptSpaces',
  GET_SPACE_FOLDERS: 'getSpaceFolders',
  GET_FOLDERS: 'getFolders',
  UPDATE_ICON: 'updateIcon',
  SIDE_PANEL_INSERT_PROMPT: 'sidePanelInsertPrompt',
  CREATE_WINDOW: 'createWindow',
  SET_DEFAULT_SPACE: 'setDefaultSpace',
  // 與我共享相關 actions
  GET_SHARED_FOLDERS: 'getSharedFolders',
  GET_SHARED_FOLDER_DETAILS: 'getSharedFolderDetails',
  REFRESH_SHARED_FOLDERS: 'refreshSharedFolders',
  GET_PUBLIC_FOLDER: 'getPublicFolder',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  PROMPT_NOT_FOUND: 'Prompt not found.',
  FAILED_TO_FETCH_FOLDERS: 'Failed to fetch folders for space',
  FAILED_TO_RELOAD: 'Failed to reload data',
  LOADING_TROUBLE: "We're having trouble loading this content. Please check your connection and try again.",
  SOMETHING_WRONG: 'Something went wrong',
  UNKNOWN_ERROR: 'Unknown error',
} as const;

// 與我共享相關的錯誤訊息
export const SHARED_ERROR_MESSAGES = {
  NO_SHARED_FOLDERS: 'No shared folders found',
  FAILED_TO_FETCH_SHARED_FOLDERS: 'Failed to fetch shared folders',
  SHARED_FOLDER_NOT_FOUND: 'Shared folder not found',
  NO_PERMISSION: 'You do not have permission to access this folder',
  PUBLIC_FOLDER_UNAVAILABLE: 'This shared folder is not available',
  INVALID_SHARE_TOKEN: 'Invalid share token',
} as const;

// Loading messages
export const LOADING_MESSAGES = {
  LOADING_PROMPTS: 'Loading Prompts...',
  LOADING: 'Loading...',
  LOADING_SHARED_FOLDERS: 'Loading Shared Folders...',
  LOADING_FOLDER_DETAILS: 'Loading Folder Details...',
} as const;

// UI text
export const UI_TEXT = {
  TRY_AGAIN: 'Try Again',
  PROMPT_LIST: 'prompts List',
  VIEW_SHARED_FOLDERS: 'View Shared Folders',
  SHARED_WITH_ME: 'Shared with Me',
  SHARED_BY: 'Shared by',
  PERMISSION_VIEW: 'View Only',
  PERMISSION_EDIT: 'Can Edit',
  SHARE_TYPE_SPACE: 'Workspace Member',
  SHARE_TYPE_ADDITIONAL: 'Direct Invite',
  SHARE_TYPE_PUBLIC: 'Public Share',
} as const;

// External URLs
export const EXTERNAL_URLS = {
  DASHBOARD: 'https://linxly-nextjs.vercel.app/',
} as const;

// CSS classes
export const CSS_CLASSES = {
  EXTENSION_CONTAINER: 'extension-container',
  SLIDE_PANEL: 'slide-panel',
  OVERFLOW_VISIBLE: 'overflow-visible',
  VISIBLE: 'visible',
  BG_WHITE: 'bg-white',
  NO_ANIMATION: 'no-animation',
} as const;
