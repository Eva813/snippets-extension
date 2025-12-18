# Chrome Extension Authentication & API Analysis

## Overview
This is a Chrome/Firefox extension for snippet management that communicates with a Next.js backend at https://linxly-nextjs.vercel.app. The authentication flow is user-initiated via login page, with subsequent state management through chrome.storage.local.

## 1. User Login Status Management

### Storage Keys
- **`userLoggedIn`**: Boolean flag indicating if user is authenticated
- **`userId`**: User ID extracted from prompt spaces or stored directly
- **`apiDomain`**: API domain URL (dev: http://localhost:3000, prod: https://linxly-nextjs.vercel.app)

### StorageService (Centralized Wrapper)
File: `/chrome-extension/src/background/services/storageService.ts`
- Generic get/set methods for chrome.storage.local
- Specialized methods:
  - `getUserLoginStatus()`: Returns boolean
  - `setUserLoginStatus(status)`: Sets login state
  - `getUserId()`: Gets cached user ID
  - `setUserId(userId)`: Caches user ID
  - `getApiDomain()`: Returns API domain
  - `setApiDomain(domain)`: Sets API domain

### API Configuration
File: `/chrome-extension/src/background/config/api.ts`
Functions:
- `checkUserLoginStatus()`: Checks if user is logged in
- `getApiDomain()`: Returns domain from storage or default
- `getUserId()`: Gets user ID from storage or extracts from promptSpaces
- `openLoginPage()`: Opens login URL in new tab

Constants:
- Development domain: http://localhost:3000
- Production domain: https://linxly-nextjs.vercel.app

## 2. Authentication Flow

### Initial Login (from Login Page)
1. User logs in via web app at domain
2. Login page sends message to content script:
   ```javascript
   window.postMessage({
     type: 'FROM_LOGIN_PAGE',
     action: 'USER_LOGGED_IN',
     data: { status: 'loggedIn', ... }
   }, window.location.origin)
   ```
3. Content script forwards to background script via chrome.runtime.sendMessage
4. AuthFeature.updateUserStatusFromClient handler:
   - Sets icon to colored version
   - Updates chrome.storage.local with:
     - `userLoggedIn: true`
     - `apiDomain: domain`
   - Fetches default space folders

### Logout Flow
1. User logs out from web app
2. Website sends message:
   ```javascript
   window.postMessage({
     type: 'FROM_SITE_HEADER',
     action: 'USER_LOGGED_OUT'
   }, window.location.origin)
   ```
3. AuthFeature.userLoggedOut handler:
   - Sets icon to gray version
   - Clears all chrome.storage.local via StorageService.clear()

### Continuous Session Management
- Content script listens to chrome.storage.onChanged
- When `userLoggedIn` changes to true:
  - Re-initializes input handler
  - Re-initializes cursor tracker
  - Reinitializes prompt manager
- When `userLoggedIn` changes to false:
  - Clears prompt cache
  - Clears input handler

## 3. Credentials & Authentication Headers

### Credentials Approach
- Uses `credentials: 'include'` in all fetch calls
- This automatically includes cookies in cross-origin requests
- Browser handles session cookies from login domain

### Custom Headers
All fetch calls include:
- `'Content-Type': 'application/json'` (for POST/PATCH)
- `'x-vercel-protection-bypass': import.meta.env.VITE_VERCEL_PREVIEW_BYPASS`
  - Environment variable: `idh6c1vRJokfIWZe8HeBCRyk92iSwBTx`
  - Used to bypass Vercel preview protection

### Custom User Identification Headers
For certain endpoints that require user context:
- `'x-user-id': userId` (added by createPrompt, fetchSharedFolders, fetchSharedFolderDetails)

## 4. API Endpoints Implemented

### Authentication Status
- **GET /login**: Opens login page in new tab

### Prompt Spaces
- **GET /api/v1/prompt-spaces**: Fetch user's owned and shared spaces
  - Stores response in `promptSpaces` chrome.storage.local
  - Extracts and caches `userId`

### Folders & Prompts
- **GET /api/v1/folders?promptSpaceId={id}**: Get all folders in a space
  - Stores in `folders` and `prompts` (as shortcut map)
  - OR space-specific: `folders_{spaceId}` and `prompts_{spaceId}`

- **GET /api/v1/prompt-spaces/{spaceId}**: Get specific space details
  - Used for pagination and details

- **PATCH /api/v1/prompt-spaces/{spaceId}**: Update space settings
  - Body: `{ action: 'setDefault' }`
  - Updates `defaultSpace` flag in cached `promptSpaces`

### Shared Folders
- **GET /api/v1/shared-folders**: Fetch user's shared folders
  - Stores in `sharedFolders` and `sharedFoldersTimestamp`

- **GET /api/v1/shared-folders/{folderId}**: Get shared folder details
  - Returns prompts in folder
  - No credentials required, but uses x-user-id header

- **GET /api/v1/shared/folder/{shareToken}**: Get public folder by token
  - No credentials or user-id needed
  - Used for public share links

### Prompt Management
- **POST /api/v1/extension/create-prompt**: Create new prompt
  - Body: `{ content, pageTitle, pageUrl, promptSpaceId, folderId? }`
  - Headers: includes `x-user-id` header
  - Response: `{ id, name, content, contentJSON, shortcut, seqNo }`

## 5. API Call Patterns

### Standard Pattern for Authenticated Endpoints
```typescript
async function fetchData() {
  // 1. Check login status
  const userLoggedIn = await checkUserLoginStatus();
  if (!userLoggedIn) {
    return { success: false, error: 'User not logged in' };
  }
  
  // 2. Get API domain
  const baseUrl = await getApiDomain();
  
  // 3. Make fetch call
  const resp = await fetch(`${baseUrl}/api/v1/...`, {
    method: 'GET|POST|PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-vercel-protection-bypass': import.meta.env.VITE_VERCEL_PREVIEW_BYPASS,
      'x-user-id': userId, // optional
    },
    credentials: 'include',
    mode: 'cors',
    body: JSON.stringify(data), // for POST/PATCH
  });
  
  // 4. Handle response
  if (!resp.ok) {
    let errorBody = '';
    try {
      errorBody = await resp.text();
    } catch (e) {}
    throw new Error(`API error, status: ${resp.status}`);
  }
  
  const data = await resp.json();
  
  // 5. Cache in chrome.storage.local
  await chrome.storage.local.set({ 
    cacheKey: data,
    timestamp: Date.now()
  });
  
  return { success: true, data };
}
```

### Error Handling
- All API functions return `{ success: boolean, data?, error?: string }`
- Errors caught as try/catch blocks
- Error response bodies read as text before throwing
- No global error handler - each function handles its own errors

## 6. Caching Strategy

### Chrome Storage Local Keys
- `userLoggedIn`: Boolean
- `userId`: string
- `apiDomain`: string
- `promptSpaces`: PromptSpacesResponse (owned + shared spaces)
- `folders`: Array of folder data
- `prompts`: Map of shortcut -> prompt
- `folders_{spaceId}`: Folder data for specific space
- `prompts_{spaceId}`: Prompts map for specific space
- `sharedFolders`: SharedFoldersResponse
- `sharedFoldersTimestamp`: number
- `currentDefaultSpaceId`: string
- `cursorPosition`: cursor position info
- `shortcutInfo`: info about shortcut-triggered actions

### Cache Invalidation
- `invalidatePromptSpacesCache`: Action handler in SpaceFeature
- Manual refetch calls via chrome.runtime.sendMessage
- Storage.onChanged listener triggers reinitialization

## 7. Content Script to Background Communication

### Message Actions
Content UI sends via chrome.runtime.sendMessage:
- `GET_PROMPT_SPACES`: Fetch prompt spaces
- `GET_SPACE_FOLDERS`: Fetch folders for space
- `SET_DEFAULT_SPACE`: Set default space for user
- `GET_SHARED_FOLDERS`: Fetch shared folders
- `GET_SHARED_FOLDER_DETAILS`: Fetch specific shared folder
- `GET_PROMPT_BY_SHORTCUT`: Retrieve prompt from cache

### Message Router
File: `/chrome-extension/src/background/core/messageRouter.ts`
- Centralized message routing
- Each message action has handler function
- Handlers return Promise<Response>

## 8. Environment Variables

### Defined in `.env`
- `VITE_VERCEL_PREVIEW_BYPASS`: `idh6c1vRJokfIWZe8HeBCRyk92iSwBTx`

### Used in Code
- `import.meta.env.VITE_VERCEL_PREVIEW_BYPASS`: Included in all API headers
- `process.env.NODE_ENV`: Determines development vs production domain
- `import.meta.env.MODE`: Determines if in development mode for logging

## Security Considerations

1. **CORS**: All fetch calls include `mode: 'cors'`
2. **Credentials**: Browser automatically includes cookies via `credentials: 'include'`
3. **Origin Validation**: Content script validates `event.origin` before processing messages
4. **Storage Scope**: chrome.storage.local is isolated per extension per profile
5. **Vercel Protection Bypass**: Token used to access preview environments
6. **No Token Storage**: No JWT tokens or API keys stored in extension storage
7. **User ID Header**: x-user-id header used for API to identify user requests

## Dependencies

### API-related
- `WebExtension Polyfill`: For cross-browser compatibility
- `chrome.storage.local`: Browser storage API
- `chrome.runtime.sendMessage`: Inter-component messaging
- `fetch API`: HTTP requests

### No External HTTP Libraries
- Uses native fetch API
- No axios, request, or other HTTP library
