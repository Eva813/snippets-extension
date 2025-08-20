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
  error: (message: string, ...args: LogArgument[]) => void;
}

/**
 * 創建一個條件化的 logger
 * @param isDev - 是否為開發環境
 * @returns Logger 實例
 */
export function createLogger(isDev: boolean): Logger {
  return {
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
    error: (message: string, ...args: LogArgument[]) => {
      // 錯誤在生產環境也需要記錄
      console.error(message, ...args);
    },
  };
}

/**
 * 默認 logger，總是輸出錯誤，開發資訊則根據全域變數判斷
 * 使用時建議用 createLogger 來明確控制環境
 */
export const logger: Logger = {
  log: () => {
    // 在共用包中預設不輸出 log，讓使用方決定
  },
  warn: () => {
    // 在共用包中預設不輸出 warn，讓使用方決定
  },
  error: (message: string, ...args: LogArgument[]) => {
    // 錯誤總是輸出
    console.error(message, ...args);
  },
};
