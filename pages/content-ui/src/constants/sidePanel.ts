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

// Loading messages
export const LOADING_MESSAGES = {
  LOADING_PROMPTS: 'Loading Prompts...',
  LOADING: 'Loading...',
} as const;

// UI text
export const UI_TEXT = {
  TRY_AGAIN: 'Try Again',
  PROMPT_LIST: 'prompts List',
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
