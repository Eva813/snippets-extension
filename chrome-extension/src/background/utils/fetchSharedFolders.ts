import { getApiDomain, checkUserLoginStatus, getUserId } from '../config/api';

export interface SharedFolderItem {
  id: string;
  name: string;
  description?: string;
  permission: 'view' | 'edit';
  shareType: 'space' | 'additional';
  promptCount: number;
  sharedFrom: string;
  shareEmail?: string;
}

export interface SharedFoldersResponse {
  folders: SharedFolderItem[];
  total: number;
}

export async function fetchSharedFolders(): Promise<{
  success: boolean;
  data?: SharedFoldersResponse;
  error?: string;
}> {
  try {
    const userLoggedIn = await checkUserLoginStatus();
    if (!userLoggedIn) {
      return { success: false, error: 'User not logged in' };
    }

    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: 'User ID not found' };
    }

    const baseUrl = await getApiDomain();
    const resp = await fetch(`${baseUrl}/api/v1/shared-folders`, {
      method: 'GET',
      headers: {
        'x-user-id': userId,
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': import.meta.env.VITE_VERCEL_PREVIEW_BYPASS,
      },
      credentials: 'include',
      mode: 'cors',
    });

    if (!resp.ok) {
      let errorBody = '';
      try {
        errorBody = await resp.text();
        console.error('fetchSharedFolders error:', errorBody);
      } catch (textError) {
        console.error('fetchSharedFolders error:', textError);
      }
      throw new Error(`fetchSharedFolders error, status: ${resp.status}, message: ${errorBody || 'unknown error'}`);
    }

    const data: SharedFoldersResponse = await resp.json();

    // Store shared folders in chrome storage with timestamp
    await chrome.storage.local.set({
      sharedFolders: data,
      sharedFoldersTimestamp: Date.now(),
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    const errorMessage = (error as Error).message || 'unknown error';
    return {
      success: false,
      error: `fetchSharedFolders error: ${errorMessage}`,
    };
  }
}
