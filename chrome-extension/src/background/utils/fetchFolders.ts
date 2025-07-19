const DEFAULT_API_DOMAIN = 'http://localhost:3000';

export async function fetchFolders() {
  try {
    const { userLoggedIn, apiDomain } = await chrome.storage.local.get(['userLoggedIn', 'apiDomain']);
    if (!userLoggedIn) {
      return { success: false, error: 'User not logged in' };
    }
    // apiDomain || DEFAULT_API_DOMAIN
    const baseUrl = 'https://linxly-nextjs-git-feat-promptspace-v3-s-80d4ea-eva813s-projects.vercel.app/';
    const resp = await fetch(`${baseUrl}/api/v1/folders`, {
      method: 'GET',
      headers: { 'x-vercel-protection-bypass': import.meta.env.VITE_VERCEL_PREVIEW_BYPASS },
      credentials: 'include',
      mode: 'cors',
    });

    if (!resp.ok) {
      let errorBody = '';
      try {
        errorBody = await resp.text();
        console.error('error:', errorBody);
      } catch (textError) {
        console.error('error:', textError);
      }

      throw new Error(`getFolders error，status: ${resp.status}, message: ${errorBody || 'unknown error'}`);
    }

    const data = await resp.json();
    const hasFolders = Array.isArray(data) && data.length > 0;
    // 整理 prompts 快取
    // 定義 Prompt 類型
    type Prompt = {
      shortcut: string;
      content: string;
      [key: string]: string | number | boolean | object | null | undefined; // 可根據需求擴展屬性
    };

    const promptsMap = (data as { prompts: Prompt[] }[]).reduce<Record<string, Prompt>>((acc, folder) => {
      folder.prompts.forEach(prompt => {
        acc[prompt.shortcut] = prompt;
      });
      return acc;
    }, {});

    // await chrome.storage.local.set({ folders: data, hasFolders });
    await chrome.storage.local.set({ folders: data, hasFolders, prompts: promptsMap });

    return {
      success: true,
      hasFolders,
      folders: data,
    };
  } catch (error) {
    const errorMessage = (error as Error).message || 'unknown error';
    await chrome.storage.local.set({ hasFolders: false });
    return {
      success: false,
      hasFolders: false,
      error: `getFolders error: ${errorMessage}`,
    };
  }
}
