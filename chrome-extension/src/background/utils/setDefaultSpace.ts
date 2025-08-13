import { getApiDomain, checkUserLoginStatus } from '../config/api';

export interface SetDefaultSpaceResponse {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  defaultSpace: boolean;
}

export async function setDefaultSpace(spaceId: string): Promise<{
  success: boolean;
  data?: SetDefaultSpaceResponse;
  error?: string;
}> {
  try {
    const userLoggedIn = await checkUserLoginStatus();
    if (!userLoggedIn) {
      return { success: false, error: 'User not logged in' };
    }

    const baseUrl = await getApiDomain();
    const resp = await fetch(`${baseUrl}/api/v1/prompt-spaces/${spaceId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': import.meta.env.VITE_VERCEL_PREVIEW_BYPASS,
      },
      credentials: 'include',
      mode: 'cors',
      body: JSON.stringify({ action: 'setDefault' }),
    });

    if (!resp.ok) {
      let errorBody = '';
      try {
        errorBody = await resp.text();
        console.error('setDefaultSpace error:', errorBody);
      } catch (textError) {
        console.error('setDefaultSpace error:', textError);
      }
      throw new Error(`setDefaultSpace error, status: ${resp.status}, message: ${errorBody || 'unknown error'}`);
    }

    const data: SetDefaultSpaceResponse = await resp.json();

    // Update the prompt spaces cache to reflect the new default
    const { promptSpaces } = await chrome.storage.local.get(['promptSpaces']);
    if (promptSpaces && promptSpaces.ownedSpaces) {
      // Reset all defaultSpace flags for owned spaces only
      promptSpaces.ownedSpaces.forEach((space: SetDefaultSpaceResponse) => {
        space.defaultSpace = space.id === spaceId;
      });

      // Update the cache
      await chrome.storage.local.set({ promptSpaces });
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    const errorMessage = (error as Error).message || 'unknown error';
    return {
      success: false,
      error: `setDefaultSpace error: ${errorMessage}`,
    };
  }
}
