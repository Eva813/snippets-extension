import { getApiDomain, checkUserLoginStatus, getUserId } from '../config/api';

export interface CreatePromptRequest {
  content: string;
  pageTitle: string;
  pageUrl: string;
  promptSpaceId: string;
  folderId?: string;
}

export interface CreatePromptResponse {
  id: string;
  name: string;
  content: string;
  shortcut: string;
  seqNo: number;
}

export async function createPrompt(request: CreatePromptRequest): Promise<{
  success: boolean;
  data?: CreatePromptResponse;
  error?: string;
}> {
  try {
    const userLoggedIn = await checkUserLoginStatus();
    if (!userLoggedIn) {
      return { success: false, error: 'User not logged in' };
    }

    // Get user ID for authentication header
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: 'Unable to get user ID' };
    }

    const baseUrl = await getApiDomain();

    // Validate input parameters
    if (!request.content || request.content.length > 10000) {
      return { success: false, error: 'Content is required and must be less than 10,000 characters' };
    }

    if (!request.pageTitle || request.pageTitle.length > 200) {
      return { success: false, error: 'Page title is required and must be less than 200 characters' };
    }

    if (!request.pageUrl || request.pageUrl.length > 500) {
      return { success: false, error: 'Page URL is required and must be less than 500 characters' };
    }

    if (!request.promptSpaceId) {
      return { success: false, error: 'Prompt space ID is required' };
    }

    // Prepare request body
    const requestBody = {
      content: request.content,
      pageTitle: request.pageTitle,
      pageUrl: request.pageUrl,
      promptSpaceId: request.promptSpaceId,
      ...(request.folderId && { folderId: request.folderId }),
    };

    console.log('📡 Calling create-prompt API with:', {
      contentLength: request.content.length,
      pageTitle: request.pageTitle,
      pageUrl: request.pageUrl,
      promptSpaceId: request.promptSpaceId,
      folderId: request.folderId,
    });

    console.log('🔍 Full API request details:', {
      url: `${baseUrl}/api/v1/extension/create-prompt`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        credentials: 'include',
      },
      body: requestBody,
    });

    const response = await fetch(`${baseUrl}/api/v1/extension/create-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'x-vercel-protection-bypass': import.meta.env.VITE_VERCEL_PREVIEW_BYPASS,
      },
      credentials: 'include',
      mode: 'cors',
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Raw API response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      ok: response.ok,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const textBody = await response.text();
        errorMessage = textBody || errorMessage;
      } catch (textError) {
        console.error('❌ Failed to read error response body:', textError);
      }

      console.error('❌ Create prompt API error:', {
        status: response.status,
        message: errorMessage,
      });

      return { success: false, error: errorMessage };
    }

    // Log the full response before parsing
    const responseText = await response.text();
    console.log('📋 Full API response body (raw):', responseText);

    let data: CreatePromptResponse;
    try {
      data = JSON.parse(responseText);
      console.log('📋 Parsed API response body:', data);
    } catch (parseError) {
      console.error('❌ Failed to parse response JSON:', parseError);
      return { success: false, error: 'Invalid JSON response from server' };
    }

    console.log('✅ Successfully created prompt:', {
      id: data.id,
      name: data.name,
      shortcut: data.shortcut,
      seqNo: data.seqNo,
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    const errorMessage = (error as Error).message || 'Unknown error';
    console.error('❌ Create prompt error:', error);
    return { success: false, error: errorMessage };
  }
}
