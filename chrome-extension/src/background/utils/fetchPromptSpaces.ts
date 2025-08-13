import { getApiDomain, checkUserLoginStatus } from '../config/api';

export interface PromptSpace {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  defaultSpace?: boolean;
}

export interface SharedSpace {
  space: PromptSpace;
  permission: 'view' | 'edit';
  sharedBy: string;
  sharedAt: string;
}

export interface PromptSpacesResponse {
  ownedSpaces: PromptSpace[];
  sharedSpaces: SharedSpace[];
}

export async function fetchPromptSpaces(): Promise<{
  success: boolean;
  data?: PromptSpacesResponse;
  error?: string;
}> {
  try {
    const userLoggedIn = await checkUserLoginStatus();
    if (!userLoggedIn) {
      return { success: false, error: 'User not logged in' };
    }

    const baseUrl = await getApiDomain();
    const resp = await fetch(`${baseUrl}/api/v1/prompt-spaces`, {
      method: 'GET',
      headers: { 'x-vercel-protection-bypass': import.meta.env.VITE_VERCEL_PREVIEW_BYPASS },
      credentials: 'include',
      mode: 'cors',
    });

    if (!resp.ok) {
      let errorBody = '';
      try {
        errorBody = await resp.text();
        console.error('fetchPromptSpaces error:', errorBody);
      } catch (textError) {
        console.error('fetchPromptSpaces error:', textError);
      }
      throw new Error(`fetchPromptSpaces error, status: ${resp.status}, message: ${errorBody || 'unknown error'}`);
    }

    const data: PromptSpacesResponse = await resp.json();

    // Store prompt spaces in chrome storage
    await chrome.storage.local.set({ promptSpaces: data });

    // Extract and cache user ID from owned spaces
    if (data.ownedSpaces && data.ownedSpaces.length > 0) {
      const userId = data.ownedSpaces[0].userId;
      await chrome.storage.local.set({ userId });
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    const errorMessage = (error as Error).message || 'unknown error';
    return {
      success: false,
      error: `fetchPromptSpaces error: ${errorMessage}`,
    };
  }
}
