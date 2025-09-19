import { StorageService } from './storageService';

export class CacheService {
  static isCacheValid(timestamp: number | undefined, ttl: number): boolean {
    return timestamp !== undefined && Date.now() - timestamp < ttl;
  }

  static async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<{ success: boolean; data?: T; error?: string }>,
    ttl: number,
    timestampKey?: string,
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const actualTimestampKey = timestampKey || `${key}Timestamp`;

    // 檢查快取
    const cachedData = await StorageService.get<T>(key);
    const cachedTimestamp = await StorageService.get<number>(actualTimestampKey);

    if (this.isCacheValid(cachedTimestamp, ttl) && cachedData) {
      return { success: true, data: cachedData };
    }

    // 重新獲取資料
    const result = await fetcher();

    if (result.success && result.data) {
      // 更新快取
      await StorageService.setMultiple({
        [key]: result.data,
        [actualTimestampKey]: Date.now(),
      });
    }

    return result;
  }

  static async invalidateCache(key: string, timestampKey?: string): Promise<void> {
    const actualTimestampKey = timestampKey || `${key}Timestamp`;
    await StorageService.removeMultiple([key, actualTimestampKey]);
  }

  static async setCacheWithTimestamp<T>(key: string, data: T, timestampKey?: string): Promise<void> {
    const actualTimestampKey = timestampKey || `${key}Timestamp`;
    await StorageService.setMultiple({
      [key]: data,
      [actualTimestampKey]: Date.now(),
    });
  }

  static async getCacheWithValidation<T>(key: string, ttl: number, timestampKey?: string): Promise<T | null> {
    const actualTimestampKey = timestampKey || `${key}Timestamp`;

    const cachedData = await StorageService.get<T>(key);
    const cachedTimestamp = await StorageService.get<number>(actualTimestampKey);

    if (this.isCacheValid(cachedTimestamp, ttl) && cachedData) {
      return cachedData;
    }

    return null;
  }
}
