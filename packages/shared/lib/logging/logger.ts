/**
 * 日誌參數類型定義
 * 支援常見的可序列化類型
 */
type LogArgument = string | number | boolean | null | undefined | Error | Record<string, unknown> | unknown[];

/**
 * Logger 介面定義
 */
export interface Logger {
  log: (...args: LogArgument[]) => void;
  warn: (...args: LogArgument[]) => void;
  error: (...args: LogArgument[]) => void;
}

/**
 * 安全的跨環境開發模式檢測
 * 支援 Node.js 和瀏覽器環境
 */
function getDevMode(): boolean {
  // Node.js 環境檢查
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'development' || Boolean(process.env.__DEV__);
  }

  // 瀏覽器環境檢查 - 檢查常見的開發標識
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.endsWith('.local')
    );
  }

  // 默認為生產環境（安全策略）
  return false;
}

const isDev = getDevMode();

/**
 * 創建一個條件化的 logger
 * @param isDevMode - 是否為開發環境
 * @returns Logger 實例
 */
export function createLogger(isDevMode: boolean): Logger {
  return {
    log: (...args: LogArgument[]) => {
      if (isDevMode) {
        console.log(...args);
      }
    },
    warn: (...args: LogArgument[]) => {
      if (isDevMode) {
        console.warn(...args);
      }
    },
    error: (...args: LogArgument[]) => {
      if (isDevMode) {
        console.error(...args);
      }
    },
  };
}

/**
 * 默認 logger，只在開發環境輸出
 * 生產環境完全靜默，確保 console 乾淨
 */
export const logger: Logger = {
  log: (...args: LogArgument[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  warn: (...args: LogArgument[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  error: (...args: LogArgument[]) => {
    if (isDev) {
      console.error(...args);
    }
  },
};
