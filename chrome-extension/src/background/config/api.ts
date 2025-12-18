/**
 * API 設定管理
 * 統一管理所有 API domain 設定
 * 根據環境變數自動切換開發/生產域名
 */

// 檢查是否為開發環境 - 使用專案統一的環境變數
const isDev = process.env.NODE_ENV === 'development';

// 定義域名常量（避免重複）
const DEVELOPMENT_DOMAIN = 'http://localhost:3003';
const PRODUCTION_DOMAIN = 'https://promptbear.ai';

export const API_CONFIG = {
  // 根據環境動態設定預設域名
  DEFAULT_DOMAIN: isDev ? DEVELOPMENT_DOMAIN : PRODUCTION_DOMAIN,
  DEVELOPMENT_DOMAIN,
  PRODUCTION_DOMAIN,
} as const;

/**
 * 驗證 API domain 是否為有效的 PromptBear 網域
 */
function isValidApiDomain(domain: string): boolean {
  if (!domain) return false;
  try {
    const url = new URL(domain);
    // 只允許 PromptBear 網域或本地開發環境
    return (
      url.hostname === 'promptbear.ai' ||
      url.hostname === 'www.promptbear.ai' ||
      url.hostname.endsWith('.promptbear.ai') ||
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1'
    );
  } catch {
    return false;
  }
}

/**
 * 取得當前使用的 API domain
 * 優先級：chrome.storage.local.apiDomain（需驗證） > DEFAULT_DOMAIN
 * 如果儲存的 domain 無效，會自動清除並使用預設值
 */
export async function getApiDomain(): Promise<string> {
  const { apiDomain } = await chrome.storage.local.get(['apiDomain']);

  // 驗證儲存的 domain 是否有效
  if (apiDomain && isValidApiDomain(apiDomain)) {
    return apiDomain;
  }

  // 如果有無效的 domain，清除它
  if (apiDomain) {
    console.warn(`[API Config] 清除無效的 apiDomain: ${apiDomain}`);
    await chrome.storage.local.remove(['apiDomain']);
  }

  return API_CONFIG.DEFAULT_DOMAIN;
}

/**
 * 檢查使用者是否已登入
 */
export async function checkUserLoginStatus(): Promise<boolean> {
  const { userLoggedIn } = await chrome.storage.local.get(['userLoggedIn']);
  return Boolean(userLoggedIn);
}

/**
 * 取得使用者 ID
 * 優先從 storage 取得，如果沒有則從 prompt spaces 中提取
 */
export async function getUserId(): Promise<string | null> {
  try {
    // First, try to get userId from storage
    const { userId } = await chrome.storage.local.get(['userId']);
    if (userId) {
      return userId;
    }

    const { promptSpaces } = await chrome.storage.local.get(['promptSpaces']);
    if (promptSpaces && promptSpaces.ownedSpaces && promptSpaces.ownedSpaces.length > 0) {
      const extractedUserId = promptSpaces.ownedSpaces[0].userId;
      if (extractedUserId) {
        // Cache the user ID for future use
        await chrome.storage.local.set({ userId: extractedUserId });
        return extractedUserId;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

/**
 * 開啟登入頁面
 */
export async function openLoginPage(): Promise<void> {
  const baseUrl = await getApiDomain();
  await chrome.tabs.create({ url: `${baseUrl}/login` });
}

// 註解掉 openPromptPage 函式，改在 background/index.ts 中本地實作
// 這樣避免 context 問題和 chrome.tabs.create 的 undefined 錯誤
/*
export async function openPromptPage(promptId: string, spaceId?: string): Promise<void> {
  // ... 原有程式碼移到 background/index.ts 中
}
*/
