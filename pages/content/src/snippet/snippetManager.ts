import type { Snippet } from '@src/types/index';

interface SnippetCache {
  [key: string]: Snippet;
}

let snippetCache: SnippetCache = {};

// 初始化程式碼片段快取
export async function initializeSnippetManager(): Promise<void> {
  await refreshSnippetCache();
  setupStorageListener();
}

// 重新整理快取資料
async function refreshSnippetCache(): Promise<void> {
  const result = await chrome.storage.local.get('snippets');
  snippetCache = result.snippets || {};
}

function setupStorageListener(): void {
  chrome.storage.onChanged.addListener(changes => {
    if (changes.snippets) {
      snippetCache = changes.snippets.newValue;
    }
  });
}

export function clearSnippetCache(): void {
  snippetCache = {};
}
// 依快捷鍵尋找程式碼片段
export function getSnippetByShortcut(shortcut: string): Snippet | null {
  if (!snippetCache || typeof snippetCache !== 'object') {
    return null;
  }
  return snippetCache[shortcut] ?? null;
}
