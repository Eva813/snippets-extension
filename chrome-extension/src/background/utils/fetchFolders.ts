import { getApiDomain, checkUserLoginStatus } from '../config/api';

export async function fetchFolders(promptSpaceId: string) {
  try {
    const userLoggedIn = await checkUserLoginStatus();
    if (!userLoggedIn) {
      return { success: false, error: 'User not logged in' };
    }

    if (!promptSpaceId) {
      return { success: false, error: 'promptSpaceId is required' };
    }

    const baseUrl = await getApiDomain();
    const url = `${baseUrl}/api/v1/folders?promptSpaceId=${promptSpaceId}`;
    const resp = await fetch(url, {
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

    // Store global folders and prompts (for backward compatibility)
    await chrome.storage.local.set({ folders: data, prompts: promptsMap });

    return {
      success: true,
      hasFolders,
      folders: data,
    };
  } catch (error) {
    const errorMessage = (error as Error).message || 'unknown error';
    return {
      success: false,
      hasFolders: false,
      error: `getFolders error: ${errorMessage}`,
    };
  }
}
