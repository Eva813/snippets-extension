const DEFAULT_API_DOMAIN = 'http://localhost:3000';

export async function fetchFolders() {
  try {
    console.log('開始執行 fetchFolders 函式');

    const { userLoggedIn, apiDomain } = await chrome.storage.local.get(['userLoggedIn', 'apiDomain']);
    if (!userLoggedIn) {
      console.log('使用者未登入，無法取得資料夾');
      return { success: false, error: 'User not logged in' };
    }

    const baseUrl = apiDomain || DEFAULT_API_DOMAIN;
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
    console.log('取得資料夾成功:', data);
    // 整理 snippets 快取
    // 定義 Snippet 類型
    type Snippet = {
      shortcut: string;
      content: string;
      [key: string]: string | number | boolean | object | null | undefined; // 可根據需求擴展屬性
    };

    const snippetsMap = (data as { snippets: Snippet[] }[]).reduce<Record<string, Snippet>>((acc, folder) => {
      folder.snippets.forEach(snippet => {
        acc[snippet.shortcut] = snippet;
      });
      return acc;
    }, {});

    // await chrome.storage.local.set({ folders: data, hasFolders });
    await chrome.storage.local.set({ folders: data, hasFolders, snippets: snippetsMap });

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
