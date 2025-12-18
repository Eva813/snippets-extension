// 基礎回應介面
export interface BaseResponse {
  success: boolean;
  error?: string;
}

// 帶有資料的回應介面
export interface DataResponse<T = unknown> extends BaseResponse {
  data?: T;
}

// 帶有訊息的回應介面
export interface MessageResponse extends BaseResponse {
  message?: string;
  response?: unknown;
}

// 帶有警告的回應介面
export interface WarningResponse extends BaseResponse {
  warning?: string;
}

// === 特定功能回應類型 ===

// Folders 相關回應
export interface FoldersResponse extends DataResponse<unknown[]> {}

// Prompts 相關回應
export interface PromptResponse extends DataResponse<unknown> {}

export interface PromptsSearchResponse extends DataResponse<unknown> {
  prompt?: unknown;
}

// Spaces 相關回應
export interface SpacesResponse extends DataResponse<unknown> {}

// 彈窗資料回應
export interface PopupDataResponse {
  data: {
    title: string;
    content: string | Record<string, unknown>;
    contentJSON?: unknown;
  } | null;
}

// UI 操作回應
export interface UIOperationResponse extends MessageResponse {}

// 設定相關回應
export interface SetDefaultSpaceResponse extends DataResponse<unknown> {
  warning?: string;
}

// 圖示更新回應
export type IconUpdateResponse = BaseResponse;

// 使用者狀態更新回應
export interface UserStatusUpdateResponse extends BaseResponse {
  message?: string;
}

// 清除快取回應
export type CacheClearResponse = BaseResponse;

// 共享資料夾回應
export interface SharedFoldersResponse
  extends DataResponse<{
    folders: unknown[];
  }> {}

export interface SharedFolderDetailsResponse
  extends DataResponse<{
    prompts: unknown[];
  }> {}

// 公開資料夾回應
export interface PublicFolderResponse extends DataResponse<unknown> {}

// 版本檢查回應
export interface VersionCheckResponse extends BaseResponse {
  versionMatched?: boolean;
  extensionVersion?: string;
  requiredVersion?: string;
  updateUrl?: string;
  message?: string;
}

// === 聯合回應類型 ===
export type AnyResponse =
  | BaseResponse
  | DataResponse
  | MessageResponse
  | WarningResponse
  | PopupDataResponse
  | UIOperationResponse
  | SetDefaultSpaceResponse
  | IconUpdateResponse
  | UserStatusUpdateResponse
  | CacheClearResponse
  | VersionCheckResponse;
