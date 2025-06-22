/**
 * 頁面工具函式 - 共用於 content 和 content-ui
 */

/**
 * 延遲初始化策略配置
 */
export const INITIALIZATION_CONFIG = {
  BASE_DELAY: 1000,
  IDLE_TIMEOUT_MULTIPLIER: 2,
} as const;

/**
 * 獲取適當的初始化延遲時間
 */
export function getInitializationDelay(): number {
  const baseDelay = INITIALIZATION_CONFIG.BASE_DELAY;
  return baseDelay;
}

/**
 * 使用 requestIdleCallback 避免干擾主執行緒
 */
export function scheduleInitialize(fn: () => void, timeout?: number): void {
  if ('requestIdleCallback' in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).requestIdleCallback(fn, {
      timeout: timeout || INITIALIZATION_CONFIG.BASE_DELAY * INITIALIZATION_CONFIG.IDLE_TIMEOUT_MULTIPLIER,
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(fn, timeout || INITIALIZATION_CONFIG.BASE_DELAY);
  }
}

/**
 * 等待 DOM 準備就緒
 */
export function waitForDOMReady(): Promise<void> {
  return new Promise(resolve => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      const handleLoad = () => {
        window.removeEventListener('load', handleLoad);
        resolve();
      };
      window.addEventListener('load', handleLoad);
    }
  });
}

/**
 * 結合等待 DOM 與閒置排程的初始化
 */
export async function idleInitialize(fn: () => void, timeout?: number): Promise<void> {
  await waitForDOMReady();
  scheduleInitialize(fn, timeout);
}
