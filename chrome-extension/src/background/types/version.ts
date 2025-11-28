/**
 * 版本檢查相關的型別定義
 */

/**
 * 後端 API 回應介面
 */
export interface VersionCheckApiResponse {
  versionMatched: boolean;
  extensionVersion: string;
  requiredVersion: string;
  updateUrl: string;
  message: string;
}

/**
 * 版本不符資訊
 * 用於內部訊息傳遞
 */
export interface VersionMismatchInfo {
  currentVersion: string;
  requiredVersion: string;
  updateUrl: string;
  message: string;
}
