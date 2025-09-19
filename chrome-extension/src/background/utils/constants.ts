// 快取相關常數
export const PROMPT_SPACES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
export const SHARED_PROMPTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// 智慧選擇目標 Space 和 Folder
export interface SmartDestination {
  targetSpaceId: string | null;
  targetFolderId: string | null;
}

export const EMPTY_DESTINATION: SmartDestination = {
  targetSpaceId: null,
  targetFolderId: null,
};

// 頁面標題處理配置
export const PAGE_TITLE_CONFIG = {
  MAX_LENGTH: 100,
  FALLBACK: 'Untitled',
} as const;

// 頁面標題清理規則
export const TITLE_SUFFIXES_TO_REMOVE = [
  / - YouTube$/i,
  / \| Facebook$/i,
  / \| Twitter$/i,
  / \| LinkedIn$/i,
  / - Wikipedia$/i,
  / \| Medium$/i,
  / - GitHub$/i,
  / \| Stack Overflow$/i,
  / - Google Search$/i,
  / - Google$/i,
  / \| Reddit$/i,
  / - Amazon\.com$/i,
  / \| 首頁$/i,
  / \| 官網$/i,
  / - 官方網站$/i,
];

// 驗證限制
export const VALIDATION_LIMITS = {
  MAX_CONTENT_LENGTH: 10000,
  MAX_PAGE_TITLE_LENGTH: 200,
  MAX_PAGE_URL_LENGTH: 500,
} as const;

// Popup 資料介面
export interface PopupData {
  title: string;
  content: string | Record<string, unknown>;
  contentJSON?: unknown;
}

// Prompt 資料介面
export interface PromptData {
  content: string;
  contentJSON?: unknown;
  shortcut: string;
  name: string;
}
