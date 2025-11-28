import { getApiDomain, checkUserLoginStatus } from '../config/api';
import { logger } from '../../../../packages/shared/lib/logging/logger';
import type { VersionCheckApiResponse, VersionMismatchInfo } from '../types/version';

/**
 * 版本檢查服務
 * 負責與後端 API 通訊，檢查 Extension 版本是否一致
 */
export class VersionService {
  /**
   * 取得當前 Extension 版本號
   * 從 manifest.json 中讀取
   */
  static getExtensionVersion(): string {
    const manifest = chrome.runtime.getManifest();
    return manifest.version;
  }

  /**
   * 呼叫後端 API 檢查版本
   * @returns API 回應或 null（失敗時）
   */
  static async checkVersion(): Promise<VersionCheckApiResponse | null> {
    try {
      // 1. 檢查使用者是否已登入
      const userLoggedIn = await checkUserLoginStatus();
      if (!userLoggedIn) {
        logger.log('[VersionService] User not logged in, skipping version check');
        return null;
      }

      // 2. 取得 Extension 版本號
      const extensionVersion = this.getExtensionVersion();
      logger.log('[VersionService] Current extension version:', extensionVersion);

      // 3. 呼叫後端 API
      const baseUrl = await getApiDomain();
      const url = `${baseUrl}/api/v1/extension/version-check`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-extension-version': extensionVersion,
          'x-vercel-protection-bypass': import.meta.env.VITE_VERCEL_PREVIEW_BYPASS || '',
        },
        credentials: 'include', // 重要：攜帶 Cookie
        mode: 'cors',
      });

      // 4. 處理回應
      if (!response.ok) {
        logger.error('[VersionService] Version check API failed:', response.status);
        return null;
      }

      const result: VersionCheckApiResponse = await response.json();
      logger.log(`[VersionService] Version check result: versionMatched=${result.versionMatched}`);

      return result;
    } catch (error) {
      logger.error('[VersionService] Version check error:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * 檢查版本並返回是否需要處理版本不符
   * @returns 版本不符的詳細資訊，如果版本一致或檢查失敗則返回 null
   */
  static async checkAndGetMismatchInfo(): Promise<VersionMismatchInfo | null> {
    const result = await this.checkVersion();

    if (!result) {
      // API 呼叫失敗，根據降級策略決定是否允許繼續
      return null;
    }

    if (result.versionMatched === false) {
      return {
        currentVersion: result.extensionVersion,
        requiredVersion: result.requiredVersion,
        updateUrl: result.updateUrl,
        message: result.message,
      };
    }

    // 版本一致
    return null;
  }
}
