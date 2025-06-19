/**
 * Content Script 管理
 * 避免初始化重複呼叫
 */

export class SafetyManager {
  private static instance: SafetyManager;
  private initialized = false;

  private constructor() {}

  static getInstance(): SafetyManager {
    if (!SafetyManager.instance) {
      SafetyManager.instance = new SafetyManager();
    }
    return SafetyManager.instance;
  }

  /**
   * 檢查是否處於安全狀態可以執行操作
   */
  isOperationSafe(): boolean {
    return this.initialized;
  }

  /**
   * 初始化安全管理器
   */
  initialize(): boolean {
    if (this.initialized) return true;
    this.initialized = true;
    return true;
  }

  /**
   * 重置安全管理器狀態
   */
  reset(): void {
    this.initialized = false;
  }
}

// 導出單例實例
export const safetyManager = SafetyManager.getInstance();
