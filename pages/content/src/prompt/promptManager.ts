import type { Prompt } from '@src/types/index';

interface PromptCache {
  [key: string]: Prompt;
}

let promptCache: PromptCache = {};

// 初始化程式碼片段快取
export async function initializePromptManager(): Promise<void> {
  await refreshPromptCache();
  setupStorageListener();
}

// 重新整理快取資料
async function refreshPromptCache(): Promise<void> {
  const result = await chrome.storage.local.get('prompts');
  promptCache = result.prompts || {};
}

function setupStorageListener(): void {
  chrome.storage.onChanged.addListener(changes => {
    if (changes.prompts) {
      promptCache = changes.prompts.newValue;
    }
  });
}

export function clearPromptCache(): void {
  promptCache = {};
}

// 依快捷鍵尋找程式碼片段
export function getPromptByShortcut(shortcut: string): Prompt | null {
  if (!promptCache || typeof promptCache !== 'object') {
    return null;
  }
  return promptCache[shortcut] ?? null;
}
