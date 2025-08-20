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
  content: string; // HTML (向後相容)
  contentJSON: unknown; // JSON (新格式)
  shortcut: string;
  seqNo: number;
}

const VALIDATION_LIMITS = {
  MAX_CONTENT_LENGTH: 10000,
  MAX_PAGE_TITLE_LENGTH: 200,
  MAX_PAGE_URL_LENGTH: 500,
} as const;

function validateCreatePromptRequest(request: CreatePromptRequest): string | null {
  if (!request.content || request.content.length > VALIDATION_LIMITS.MAX_CONTENT_LENGTH) {
    return `Content is required and must be less than ${VALIDATION_LIMITS.MAX_CONTENT_LENGTH.toLocaleString()} characters`;
  }
  if (!request.pageTitle || request.pageTitle.length > VALIDATION_LIMITS.MAX_PAGE_TITLE_LENGTH) {
    return `Page title is required and must be less than ${VALIDATION_LIMITS.MAX_PAGE_TITLE_LENGTH} characters`;
  }
  if (request.pageUrl.length > VALIDATION_LIMITS.MAX_PAGE_URL_LENGTH) {
    return `Page URL must be less than ${VALIDATION_LIMITS.MAX_PAGE_URL_LENGTH} characters`;
  }
  if (!request.promptSpaceId) {
    return 'Prompt space ID is required';
  }
  return null;
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
    const validationError = validateCreatePromptRequest(request);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // Prepare request body
    const requestBody = {
      content: request.content,
      pageTitle: request.pageTitle,
      pageUrl: request.pageUrl,
      promptSpaceId: request.promptSpaceId,
      ...(request.folderId && { folderId: request.folderId }),
    };

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

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const textBody = await response.text();
        errorMessage = textBody || errorMessage;
      } catch (textError) {
        console.error('Failed to read error response body:', textError);
      }

      console.error('Create prompt API error:', {
        status: response.status,
        message: errorMessage,
      });

      return { success: false, error: errorMessage };
    }

    // Log the full response before parsing
    const responseText = await response.text();

    let data: CreatePromptResponse;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response JSON:', parseError);
      return { success: false, error: 'Invalid JSON response from server' };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    const errorMessage = (error as Error).message || 'Unknown error';
    console.error('Create prompt error:', error);
    return { success: false, error: errorMessage };
  }
}
