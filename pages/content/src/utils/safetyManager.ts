/**
 * Content Script 安全管理器
 * 簡化版本 - 只保留核心功能
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
   * 檢查 Chrome Runtime 狀態
   */
  checkRuntimeStatus(): boolean {
    try {
      return !!(chrome?.runtime?.id && !chrome.runtime.lastError);
    } catch (error) {
      console.warn('Chrome runtime check failed:', error);
      return false;
    }
  }

  /**
   * 檢查是否為 React 頁面
   */
  isReactPage(): boolean {
    try {
      return !!(
        document.querySelector('[data-reactroot]') ||
        document.querySelector('script[src*="react"]') ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).React ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__
      );
    } catch (error) {
      console.warn('React page detection failed:', error);
      return false;
    }
  }

  /**
   * 檢查元素是否安全可編輯（避免 React 管理的元素）
   */
  isSafeToEdit(element: HTMLElement): boolean {
    try {
      if (!element || !element.isConnected) {
        return false;
      }

      // 簡化的 React 元素檢查
      const isReactElement = !!(
        element.hasAttribute('data-reactroot') ||
        element.closest('[data-reactroot]') ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (element as any)._reactInternalFiber ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (element as any)._reactInternalInstance
      );

      if (isReactElement) {
        console.warn('檢測到 React 管理的元素，需要特殊處理');
        return false;
      }

      return true;
    } catch (error) {
      console.error('安全檢查失敗:', error);
      return false;
    }
  }

  /**
   * 初始化安全管理器
   */
  initialize(): void {
    if (this.initialized) return;

    try {
      this.initialized = true;
      console.log('SafetyManager 已初始化');
    } catch (error) {
      console.error('SafetyManager 初始化失敗:', error);
    }
  }
}

// 導出單例實例
export const safetyManager = SafetyManager.getInstance();
