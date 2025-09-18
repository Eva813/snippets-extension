import { getApiDomain, checkUserLoginStatus, getUserId } from '../config/api';

export interface PromptItem {
  id: string;
  name: string;
  content: string;
  contentJSON: object | null;
  shortcut?: string;
}

export interface SharedFolderDetailResponse {
  id: string;
  name: string;
  description?: string;
  promptCount: number;
  sharedFrom: string;
  shareType: 'space' | 'additional' | 'public';
  permission: 'view' | 'edit';
  shareEmail?: string;
  prompts: PromptItem[];
}

export async function fetchSharedFolderDetails(folderId: string): Promise<{
  success: boolean;
  data?: SharedFolderDetailResponse;
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
    const resp = await fetch(`${baseUrl}/api/v1/shared-folders/${folderId}`, {
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
        console.error('fetchSharedFolderDetails error:', errorBody);
      } catch (textError) {
        console.error('fetchSharedFolderDetails error:', textError);
      }
      throw new Error(
        `fetchSharedFolderDetails error, status: ${resp.status}, message: ${errorBody || 'unknown error'}`,
      );
    }

    const data: SharedFolderDetailResponse = await resp.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    const errorMessage = (error as Error).message || 'unknown error';
    return {
      success: false,
      error: `fetchSharedFolderDetails error: ${errorMessage}`,
    };
  }
}

export interface PublicFolderResponse {
  available: boolean;
  data?: {
    folder: {
      name: string;
      description: string;
    };
    prompts: PublicPromptItem[];
  };
  error?: {
    code: 'NOT_FOUND' | 'INACTIVE' | 'TEAM_ONLY' | 'FOLDER_DELETED';
    message: string;
    cta: {
      text: string;
      link: string;
    };
  };
}

export interface PublicPromptItem {
  id: string;
  name: string;
  content: string;
  contentJSON: object | null;
  shortcut?: string;
}

export async function fetchPublicFolder(shareToken: string): Promise<{
  success: boolean;
  data?: PublicFolderResponse;
  error?: string;
}> {
  try {
    const baseUrl = await getApiDomain();
    const resp = await fetch(`${baseUrl}/api/v1/shared/folder/${shareToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': import.meta.env.VITE_VERCEL_PREVIEW_BYPASS,
      },
      mode: 'cors',
    });

    // 公開分享 API 即使失敗也會返回 JSON 格式
    const data: PublicFolderResponse = await resp.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    const errorMessage = (error as Error).message || 'unknown error';
    return {
      success: false,
      error: `fetchPublicFolder error: ${errorMessage}`,
    };
  }
}
