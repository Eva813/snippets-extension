import { getApiDomain, checkUserLoginStatus } from '../config/api';

export interface PromptApiResponse {
  id: string;
  name: string;
  content: string;
  shortcut: string;
  seqNo?: number;
}

export interface FolderData {
  id: string;
  name: string;
  description?: string;
  userId: string;
  prompts?: PromptApiResponse[];
}

export async function fetchSpaceFolders(promptSpaceId: string): Promise<{
  success: boolean;
  data?: FolderData[];
  error?: string;
}> {
  try {
    const userLoggedIn = await checkUserLoginStatus();
    if (!userLoggedIn) {
      return { success: false, error: 'User not logged in' };
    }

    const baseUrl = await getApiDomain();
    const resp = await fetch(`${baseUrl}/api/v1/folders?promptSpaceId=${promptSpaceId}`, {
      method: 'GET',
      headers: { 'x-vercel-protection-bypass': import.meta.env.VITE_VERCEL_PREVIEW_BYPASS },
      credentials: 'include',
      mode: 'cors',
    });

    if (!resp.ok) {
      let errorBody = '';
      try {
        errorBody = await resp.text();
        console.error('fetchSpaceFolders error:', errorBody);
      } catch (textError) {
        console.error('fetchSpaceFolders error:', textError);
      }
      throw new Error(`fetchSpaceFolders error, status: ${resp.status}, message: ${errorBody || 'unknown error'}`);
    }

    const data: FolderData[] = await resp.json();

    // 整理 prompts 快取
    const promptsMap = data.reduce<Record<string, PromptApiResponse>>((acc, folder) => {
      if (folder.prompts) {
        folder.prompts.forEach(prompt => {
          acc[prompt.shortcut] = prompt;
        });
      }
      return acc;
    }, {});

    // Store folders and prompts for this space
    await chrome.storage.local.set({
      [`folders_${promptSpaceId}`]: data,
      [`prompts_${promptSpaceId}`]: promptsMap,
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    const errorMessage = (error as Error).message || 'unknown error';
    return {
      success: false,
      error: `fetchSpaceFolders error: ${errorMessage}`,
    };
  }
}
