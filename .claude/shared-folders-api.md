# 共享資料夾 API 使用文件

**版本**: 1.0  
**更新日期**: 2025-09-17  
**專案**: PromptBear - Linxly Next.js  
**範圍**: 與我共享功能 API 完整文件

---

## 📋 目錄

1. [概述](#概述)
2. [認證方式](#認證方式)
3. [API 端點](#api-端點)
4. [使用範例](#使用範例)
5. [錯誤處理](#錯誤處理)
6. [整合指南](#整合指南)
7. [最佳實務](#最佳實務)

---

## 🎯 概述

「與我共享」API 提供完整的共享資料夾存取功能，支援外部工具和應用程式整合。系統支援三種分享類型：

- **Space 分享**: 透過工作空間成員資格獲得的權限
- **額外邀請**: 透過 email 直接邀請獲得的權限  
- **公開分享**: 透過分享連結公開存取

### 核心功能
- ✅ 取得所有共享資料夾列表
- ✅ 查看特定資料夾詳情和內容
- ✅ 存取資料夾內的所有 prompts
- ✅ 支援權限控制和驗證
- ✅ 記憶體快取優化
- ✅ 公開分享 token 存取

---

## 🔐 認證方式

### 私人存取（需要認證）
所有私人 API 端點都需要在 HTTP Header 中提供使用者 ID：

```http
x-user-id: {userId}
Content-Type: application/json
```

### 公開存取（無需認證）
公開分享的資料夾可以透過 `shareToken` 直接存取，無需提供認證資訊。

---

## 📡 API 端點

### 1. 取得共享資料夾列表

#### 端點資訊
```http
GET /api/v1/shared-folders
```

**需要認證**: ✅ 是  
**快取時間**: 10 分鐘  

#### 請求範例
```bash
curl -X GET \
  'https://your-domain.com/api/v1/shared-folders' \
  -H 'x-user-id: user123456' \
  -H 'Content-Type: application/json'
```

#### 回應格式
```typescript
interface SharedFoldersResponse {
  folders: SharedFolderItem[];
  total: number;
}

interface SharedFolderItem {
  id: string;                           // 資料夾 ID
  name: string;                         // 資料夾名稱
  description?: string;                 // 資料夾描述
  permission: 'view' | 'edit';          // 使用者權限
  shareType: 'space' | 'additional';    // 分享類型
  promptCount: number;                  // Prompt 數量
  sharedFrom: string;                   // 分享者名稱
  shareEmail?: string;                  // 分享者 Email
}
```

#### 回應範例
```json
{
  "folders": [
    {
      "id": "folder_abc123",
      "name": "行銷活動 Prompts",
      "description": "社群媒體行銷相關的 prompt 模板",
      "permission": "edit",
      "shareType": "space",
      "promptCount": 15,
      "sharedFrom": "張小明",
      "shareEmail": "ming@company.com"
    },
    {
      "id": "folder_def456",
      "name": "客服回覆模板",
      "description": null,
      "permission": "view",
      "shareType": "additional",
      "promptCount": 8,
      "sharedFrom": "李小美",
      "shareEmail": "mei@company.com"
    }
  ],
  "total": 2
}
```

---

### 2. 取得特定共享資料夾詳情

#### 端點資訊
```http
GET /api/v1/shared-folders/{folderId}
```

**需要認證**: ✅ 是  
**權限檢查**: ✅ 自動驗證使用者權限  

#### 請求範例
```bash
curl -X GET \
  'https://your-domain.com/api/v1/shared-folders/folder_abc123' \
  -H 'x-user-id: user123456' \
  -H 'Content-Type: application/json'
```

#### 回應格式
```typescript
interface SharedFolderDetailResponse {
  id: string;                           // 資料夾 ID
  name: string;                         // 資料夾名稱
  description?: string;                 // 資料夾描述
  promptCount: number;                  // Prompt 數量
  sharedFrom: string;                   // 分享者名稱
  shareType: 'space' | 'additional' | 'public'; // 分享類型
  permission: 'view' | 'edit';          // 使用者權限
  shareEmail?: string;                  // 分享者 Email
  prompts: PromptItem[];                // Prompt 列表
}

interface PromptItem {
  id: string;                           // Prompt ID
  name: string;                         // Prompt 名稱
  content: string;                      // Prompt 內容（純文字）
  contentJSON: object | null;           // Prompt 內容（結構化）
  shortcut?: string;                    // 快捷鍵
}
```

#### 回應範例
```json
{
  "id": "folder_abc123",
  "name": "行銷活動 Prompts",
  "description": "社群媒體行銷相關的 prompt 模板",
  "promptCount": 2,
  "sharedFrom": "張小明",
  "shareType": "space",
  "permission": "edit",
  "shareEmail": "ming@company.com",
  "prompts": [
    {
      "id": "prompt_123",
      "name": "Instagram 貼文生成",
      "content": "請為以下主題生成一篇 Instagram 貼文：{topic}",
      "contentJSON": {
        "blocks": [
          {
            "type": "paragraph",
            "data": {
              "text": "請為以下主題生成一篇 Instagram 貼文：{topic}"
            }
          }
        ]
      },
      "shortcut": "ig-post"
    },
    {
      "id": "prompt_456",
      "name": "Facebook 廣告文案",
      "content": "撰寫一個吸引人的 Facebook 廣告文案，產品：{product}",
      "contentJSON": null,
      "shortcut": "fb-ad"
    }
  ]
}
```

---

### 3. 公開分享資料夾存取

#### 端點資訊
```http
GET /api/v1/shared/folder/{shareToken}
```

**需要認證**: ❌ 否  
**公開存取**: ✅ 透過 shareToken  

#### 請求範例
```bash
curl -X GET \
  'https://your-domain.com/api/v1/shared/folder/share_token_xyz789' \
  -H 'Content-Type: application/json'
```

#### 回應格式
```typescript
interface PublicFolderResponse {
  available: boolean;
  data?: {
    folder: {
      name: string;                     // 資料夾名稱
      description: string;              // 資料夾描述
    };
    prompts: PublicPromptItem[];        // Prompt 列表
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

interface PublicPromptItem {
  id: string;                           // Prompt ID
  name: string;                         // Prompt 名稱
  content: string;                      // Prompt 內容
  contentJSON: object | null;           // 結構化內容
  shortcut?: string;                    // 快捷鍵
}
```

#### 成功回應範例
```json
{
  "available": true,
  "data": {
    "folder": {
      "name": "公開行銷模板",
      "description": "免費的行銷 prompt 模板分享"
    },
    "prompts": [
      {
        "id": "prompt_public_123",
        "name": "產品介紹文案",
        "content": "為 {product_name} 撰寫一段簡潔有力的產品介紹",
        "contentJSON": null,
        "shortcut": "product-intro"
      }
    ]
  }
}
```

#### 錯誤回應範例
```json
{
  "available": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "This shared folder could not be found",
    "cta": {
      "text": "Create your own workspace",
      "link": "/sign-up"
    }
  }
}
```

---

## 💡 使用範例

### JavaScript/TypeScript 整合

#### 基本 API 呼叫函數
```typescript
class SharedFoldersAPI {
  private baseURL: string;
  private userId: string;

  constructor(baseURL: string, userId: string) {
    this.baseURL = baseURL;
    this.userId = userId;
  }

  // 取得共享資料夾列表
  async getSharedFolders(): Promise<SharedFoldersResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/shared-folders`, {
      method: 'GET',
      headers: {
        'x-user-id': this.userId,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // 取得資料夾詳情
  async getFolderDetails(folderId: string): Promise<SharedFolderDetailResponse> {
    const response = await fetch(
      `${this.baseURL}/api/v1/shared-folders/${folderId}`,
      {
        method: 'GET',
        headers: {
          'x-user-id': this.userId,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // 公開存取資料夾
  static async getPublicFolder(
    baseURL: string,
    shareToken: string
  ): Promise<PublicFolderResponse> {
    const response = await fetch(
      `${baseURL}/api/v1/shared/folder/${shareToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.json(); // 即使錯誤也返回 JSON
  }
}
```

#### 使用範例
```typescript
// 初始化 API 客戶端
const api = new SharedFoldersAPI('https://your-domain.com', 'user123456');

// 1. 取得所有共享資料夾
try {
  const folders = await api.getSharedFolders();
  console.log(`找到 ${folders.total} 個共享資料夾`);
  
  folders.folders.forEach(folder => {
    console.log(`資料夾: ${folder.name} (${folder.promptCount} 個 prompts)`);
  });
} catch (error) {
  console.error('取得共享資料夾失敗:', error);
}

// 2. 取得特定資料夾的 prompts
try {
  const folderDetails = await api.getFolderDetails('folder_abc123');
  console.log(`資料夾: ${folderDetails.name}`);
  
  folderDetails.prompts.forEach(prompt => {
    console.log(`Prompt: ${prompt.name}`);
    console.log(`內容: ${prompt.content}`);
    console.log(`快捷鍵: ${prompt.shortcut || '無'}`);
  });
} catch (error) {
  console.error('取得資料夾詳情失敗:', error);
}

// 3. 存取公開分享資料夾
try {
  const publicFolder = await SharedFoldersAPI.getPublicFolder(
    'https://your-domain.com',
    'share_token_xyz789'
  );
  
  if (publicFolder.available) {
    console.log(`公開資料夾: ${publicFolder.data.folder.name}`);
    publicFolder.data.prompts.forEach(prompt => {
      console.log(`- ${prompt.name}: ${prompt.content}`);
    });
  } else {
    console.log(`存取失敗: ${publicFolder.error.message}`);
  }
} catch (error) {
  console.error('存取公開資料夾失敗:', error);
}
```

### Python 整合範例

```python
import requests
from typing import Optional, Dict, Any

class SharedFoldersAPI:
    def __init__(self, base_url: str, user_id: str):
        self.base_url = base_url
        self.user_id = user_id
        self.headers = {
            'x-user-id': user_id,
            'Content-Type': 'application/json'
        }
    
    def get_shared_folders(self) -> Dict[str, Any]:
        """取得共享資料夾列表"""
        response = requests.get(
            f"{self.base_url}/api/v1/shared-folders",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_folder_details(self, folder_id: str) -> Dict[str, Any]:
        """取得資料夾詳情"""
        response = requests.get(
            f"{self.base_url}/api/v1/shared-folders/{folder_id}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    @staticmethod
    def get_public_folder(base_url: str, share_token: str) -> Dict[str, Any]:
        """存取公開分享資料夾"""
        response = requests.get(
            f"{base_url}/api/v1/shared/folder/{share_token}",
            headers={'Content-Type': 'application/json'}
        )
        return response.json()

# 使用範例
api = SharedFoldersAPI('https://your-domain.com', 'user123456')

# 取得所有共享資料夾
folders = api.get_shared_folders()
print(f"找到 {folders['total']} 個共享資料夾")

# 取得第一個資料夾的詳情
if folders['folders']:
    first_folder = folders['folders'][0]
    details = api.get_folder_details(first_folder['id'])
    print(f"資料夾: {details['name']}")
    for prompt in details['prompts']:
        print(f"- {prompt['name']}: {prompt['content']}")
```

---

## ⚠️ 錯誤處理

### HTTP 狀態碼

| 狀態碼 | 說明 | 處理方式 |
|--------|------|----------|
| `200` | 成功 | 正常處理回應資料 |
| `401` | 未授權 | 檢查 `x-user-id` header |
| `404` | 找不到資源 | 資料夾不存在或無權限存取 |
| `500` | 伺服器錯誤 | 稍後重試或聯繫支援 |

### 錯誤回應格式

```typescript
interface APIError {
  error: string;
  message?: string;
  statusCode?: number;
}
```

### 常見錯誤處理

```typescript
async function handleAPICall<T>(apiCall: () => Promise<T>): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    if (error instanceof Error) {
      const status = (error as any).status;
      
      switch (status) {
        case 401:
          console.error('認證失敗，請檢查使用者 ID');
          break;
        case 404:
          console.error('資源不存在或無權限存取');
          break;
        case 500:
          console.error('伺服器錯誤，請稍後重試');
          break;
        default:
          console.error('未知錯誤:', error.message);
      }
    }
    return null;
  }
}

// 使用範例
const folders = await handleAPICall(() => api.getSharedFolders());
if (folders) {
  // 處理成功回應
}
```

---

## 🔧 整合指南

### 1. 認證設定

確保在每個 API 請求中包含正確的 `x-user-id` header：

```typescript
const headers = {
  'x-user-id': 'your-user-id',
  'Content-Type': 'application/json',
};
```

### 2. 權限驗證

API 會自動驗證使用者權限：

- **view**: 可以查看資料夾和 prompts
- **edit**: 可以查看並修改內容
- **public**: 透過 shareToken 公開存取

### 3. 資料夾類型識別

根據 `shareType` 欄位識別分享來源：

```typescript
function getShareTypeLabel(shareType: string): string {
  switch (shareType) {
    case 'space':
      return '工作空間成員';
    case 'additional':
      return '直接邀請';
    case 'public':
      return '公開分享';
    default:
      return '未知來源';
  }
}
```

### 4. 快取策略

API 實施了記憶體快取：

- **共享資料夾列表**: 快取 10 分鐘
- **Cache-Control**: `public, s-maxage=600, stale-while-revalidate=300`
- **快取標示**: 回應 header 包含 `X-Cache: HIT/MISS`

---

## 🚀 最佳實務

### 1. 效能優化

```typescript
// 批量處理：先取得列表，再根據需要取得詳情
const folders = await api.getSharedFolders();
const importantFolders = folders.folders.filter(f => f.promptCount > 10);

// 並行取得多個資料夾詳情
const details = await Promise.all(
  importantFolders.map(folder => api.getFolderDetails(folder.id))
);
```

### 2. 錯誤重試機制

```typescript
async function retryableRequest<T>(
  request: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await request();
    } catch (error) {
      lastError = error as Error;
      
      // 只有伺服器錯誤才重試
      if ((error as any).status !== 500) {
        throw error;
      }
      
      // 指數退避
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  
  throw lastError;
}
```

### 3. 資料快取

```typescript
class CachedSharedFoldersAPI extends SharedFoldersAPI {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 分鐘

  async getSharedFoldersWithCache() {
    const cacheKey = 'shared-folders';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    const data = await this.getSharedFolders();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }
}
```

### 4. 類型安全

使用 TypeScript 定義確保類型安全：

```typescript
// 定義共享介面
interface SharedFolder {
  id: string;
  name: string;
  permission: 'view' | 'edit';
  prompts: Prompt[];
}

interface Prompt {
  id: string;
  name: string;
  content: string;
  shortcut?: string;
}

// 使用泛型確保類型安全
async function processSharedFolders<T extends SharedFolder>(
  folders: T[]
): Promise<void> {
  folders.forEach(folder => {
    console.log(`處理資料夾: ${folder.name}`);
    folder.prompts.forEach(prompt => {
      console.log(`- Prompt: ${prompt.name}`);
    });
  });
}
```

---

## 📞 支援與回饋

如有任何問題或建議，請聯繫：

- **技術支援**: [技術團隊聯絡方式]
- **API 文件**: 本文件會持續更新
- **版本更新**: 關注 API 版本變更通知

---

**最後更新**: 2025-09-17  
**文件版本**: 1.0  
**API 版本**: v1  
**相容性**: ✅ 向下相容