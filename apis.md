
  2. Prompt Spaces (工作空間)

  獲取所有 Spaces

  - GET /prompt-spaces
  - 回應:
  {
    "ownedSpaces": [PromptSpaceApiResponse],
    "sharedSpaces": [SharedSpace]
  }

  創建 Space

  - POST /prompt-spaces
  - 請求體:
  {
    "name": "string"
  }

  更新 Space

  - PUT /prompt-spaces/{spaceId}
  - 請求體:
  {
    "name": "string"
  }

  刪除 Space

  - DELETE /prompt-spaces/{spaceId}

  獲取 Space 概覽

  - GET /prompt-spaces/{spaceId}/overview
  - 回應:
  {
    "space": {
      "id": "string",
      "name": "string",
      "userRole": "owner|edit|view",
      "permissions": {...}
    },
    "folders": [...],
    "stats": {...}
  }

  3. 分享管理 (Sharing)

  獲取分享列表

  - GET /prompt-spaces/{spaceId}/shares

  創建分享 (批量)

  - POST /prompt-spaces/{spaceId}/shares
  - 請求體:
  {
    "shares": [
      {
        "email": "string",
        "permission": "view|edit"
      }
    ]
  }

  更新分享權限 (批量)

  - PUT /prompt-spaces/{spaceId}/shares

  刪除分享 (批量)

  - DELETE /prompt-spaces/{spaceId}/shares
  - 請求體:
  {
    "emails": ["string"]
  }

  獲取邀請連結

  - GET /prompt-spaces/{spaceId}/invite-links

  4. 邀請處理 (Invitations)

  獲取邀請詳情

  - GET /invites/{shareId}
  - 回應:
  {
    "spaceId": "string",
    "spaceName": "string",
    "ownerName": "string",
    "permission": "view|edit",
    "isValid": true,
    "needsRegistration": true
  }

  接受邀請

  - POST /invites/{shareId}/accept
  - 請求體:
  {
    "userId": "string"
  }

  5. 資料夾 (Folders)

  獲取資料夾列表

  - GET /folders?promptSpaceId={spaceId}
  - 回應: FolderData[]

  創建資料夾

  - POST /folders
  - 請求體:
  {
    "name": "string",
    "description": "string",
    "promptSpaceId": "string"
  }

  更新資料夾

  - PUT /folders/{folderId}

  刪除資料夾

  - DELETE /folders/{folderId}

  6. Prompts (提示詞)

  獲取 Prompts

  - GET /prompts?folderId={folderId}&promptSp
  aceId={spaceId}
  - 回應: PromptApiResponse[]

  創建 Prompt

  - POST /prompts
  - 請求體:
  {
    "folderId": "string",
    "name": "string",
    "content": "string",
    "shortcut": "string",
    "promptSpaceId": "string",
    "afterPromptId": "string?"
  }

  更新 Prompt

  - PUT /prompts/{promptId}

  刪除 Prompt

  - DELETE /prompts/{promptId}

  數據模型

  PromptSpaceApiResponse

  {
    id: string;
    name: string;
    userId: string;
    createdAt: string;
    updatedAt?: string;
  }

  PromptApiResponse

  {
    id: string;
    name: string;
    content: string;
    shortcut: string;
    seqNo?: number;
  }

  FolderData

  {
    id: string;
    name: string;
    description?: string;
    userId: string;
    prompts?: PromptApiResponse[];
  }

  狀態碼

  - 200 - 成功
  - 201 - 創建成功
  - 400 - 請求錯誤
  - 401 - 未認證
  - 403 - 權限不足
  - 404 - 資源不存在
  - 409 - 衝突 (如重複創建)
  - 410 - 已過期
  - 500 - 服務器錯誤



----


特色功能

  1. 多工作空間支援: 用戶可創建多個 prompt
  spaces
  2. 權限分級: owner/edit/view 三級權限控制
  3. 批量分享: 支援批量邀請和權限管理
  4. 序列號優化: Prompts
  5. 通用邀請連結: 支援通用分享連結功能


  此 API 文檔涵蓋了完整的 prompt
  管理系統，包括認證、工作空間管理、分享協作
  、資料夾組織和提示詞管理等核心功能。

> 請問 prompt space overview , 
  所拿到的資料結構？要如何區分這個 space 
  為shared 而我是被分享的，或是擁有者？我要給
  其他前端專案，打此專案的 api 來獲取 space ,
   folder , prompt 內容

⏺ 讓我檢查 prompt space overview API
  的詳細資料結構和權限判斷邏輯：

⏺ Read(src/app/api/v1/prompt-spaces/[spaceId]
      /overview/route.ts)
  ⎿  Read 20 lines (ctrl+r to expand)

⏺ 讓我再檢查權限判斷的詳細邏輯：

⏺ Read(src/app/api/v1/prompt-spaces/[spaceId]
      /overview/route.ts)
  ⎿  Read 30 lines (ctrl+r to expand)

⏺ 讓我也檢查 prompt spaces 列表
  API，看看如何區分 owned 和 shared spaces：

⏺ Read(src/app/api/v1/prompt-spaces/route.ts)
  ⎿  Read 15 lines (ctrl+r to expand)

⏺ 根據代碼分析，以下是完整的資料結構和權限判
  斷說明：

  Prompt Space Overview API 資料結構

  API 端點

  GET
  /api/v1/prompt-spaces/{spaceId}/overview

  回應資料結構

  {
    space: {
      id: string;
      name: string;
      userRole: 'owner' | 'edit' | 'view';
  // 關鍵字段！
      permissions: {
        canEdit: boolean;        // owner 或 
  edit 權限
        canDelete: boolean;      // owner 或 
  edit 權限  
        canShare: boolean;       // 僅 owner
        canManageMembers: boolean; // 僅 
  owner
      };
      createdAt: Date;
      updatedAt: Date;
    },
    folders: [
      {
        id: string;
        name: string;
        description: string;
        promptCount: number;
        lastUpdated: string;
        readOnly: boolean;  // 基於權限設定
      }
    ],
    stats: {
      totalFolders: number;
      totalPrompts: number;
    }
  }

  權限判斷邏輯

  1. 判斷是否為擁有者 vs 被分享者

  // 透過 userRole 字段判斷
  if (response.space.userRole === 'owner') {
    // 這個用戶是 space 的擁有者
    console.log('你是此 space 的擁有者');
  } else if (response.space.userRole ===
  'edit' || response.space.userRole ===
  'view') {
    // 這個用戶是被分享的
    console.log('此 space 是別人分享給你的');
    console.log('你的權限是:',
  response.space.userRole);
  }

  2. 權限檢查

  const { permissions } = response.space;

  if (permissions.canEdit) {
    // 可以編輯 folders 和 prompts
  }

  if (permissions.canShare) {
    // 可以分享給其他人 (僅 owner)
  }

  if (permissions.canManageMembers) {
    // 可以管理成員 (僅 owner)
  }

  獲取所有 Spaces 的 API

  API 端點

  GET /api/v1/prompt-spaces

  回應資料結構

  {
    ownedSpaces: [
      {
        id: string;
        name: string;
        userId: string;
        createdAt: string;
        updatedAt: string;
      }
    ],
    sharedSpaces: [
      {
        space: {
          id: string;
          name: string;
          userId: string;
          createdAt: string;
          updatedAt: string;
        },
        permission: 'view' | 'edit';
        sharedBy: string;  // 分享者名稱
        sharedAt: string;  // 分享時間
      }
    ]
  }

  完整的資料獲取流程

  前端使用建議

  // 1. 獲取所有 spaces
  const spacesResponse = await
  fetch('/api/v1/prompt-spaces', {
    headers: { 'x-user-id': userId }
  });
  const { ownedSpaces, sharedSpaces } = await
   spacesResponse.json();

  // 2. 獲取特定 space 的詳細資訊
  const spaceId = 'some-space-id';
  const overviewResponse = await fetch(`/api/
  v1/prompt-spaces/${spaceId}/overview`, {
    headers: { 'x-user-id': userId }
  });
  const overview = await
  overviewResponse.json();

  // 3. 判斷權限
  const isOwner = overview.space.userRole ===
   'owner';
  const isShared = ['edit',
  'view'].includes(overview.space.userRole);
  const canEdit =
  overview.space.permissions.canEdit;

  // 4. 獲取 folders 和 prompts
  const foldersResponse = await fetch(`/api/v
  1/folders?promptSpaceId=${spaceId}`, {
    headers: { 'x-user-id': userId }
  });
  const folders = await
  foldersResponse.json();

  // 5. 獲取特定 folder 的 prompts  
  const folderId = 'some-folder-id';
  const promptsResponse = await
  fetch(`/api/v1/prompts?folderId=${folderId}
  &promptSpaceId=${spaceId}`, {
    headers: { 'x-user-id': userId }
  });
  const prompts = await
  promptsResponse.json();

  關鍵判斷點

  1. userRole 是判斷擁有者/被分享者的關鍵字段
    - 'owner' = 擁有者
    - 'edit'/'view' = 被分享者
  2. permissions 物件提供具體的操作權限
  3. spaces 列表 API 明確分為 ownedSpaces 和
  sharedSpaces 兩個陣列

  這樣的設計讓前端可以清楚區分用戶與 space
  的關係，並根據權限控制 UI 顯示和功能開放。