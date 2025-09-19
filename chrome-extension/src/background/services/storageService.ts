export class StorageService {
  static async get<T>(key: string): Promise<T | undefined> {
    const result = await chrome.storage.local.get(key);
    return result[key];
  }

  static async getMultiple<T extends Record<string, unknown>>(keys: (keyof T)[]): Promise<Partial<T>> {
    const result = await chrome.storage.local.get(keys as string[]);
    return result as Partial<T>;
  }

  static async set<T>(key: string, value: T): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }

  static async setMultiple<T extends Record<string, unknown>>(data: Partial<T>): Promise<void> {
    await chrome.storage.local.set(data);
  }

  static async remove(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  }

  static async removeMultiple(keys: string[]): Promise<void> {
    await chrome.storage.local.remove(keys);
  }

  static async clear(): Promise<void> {
    await chrome.storage.local.clear();
  }

  // 專用方法
  static async getUserLoginStatus(): Promise<boolean> {
    const { userLoggedIn } = await chrome.storage.local.get('userLoggedIn');
    return Boolean(userLoggedIn);
  }

  static async setUserLoginStatus(status: boolean): Promise<void> {
    await chrome.storage.local.set({ userLoggedIn: status });
  }

  static async getCurrentDefaultSpaceId(): Promise<string | undefined> {
    return await this.get<string>('currentDefaultSpaceId');
  }

  static async setCurrentDefaultSpaceId(spaceId: string): Promise<void> {
    await this.set('currentDefaultSpaceId', spaceId);
  }

  static async getApiDomain(): Promise<string | undefined> {
    return await this.get<string>('apiDomain');
  }

  static async setApiDomain(domain: string): Promise<void> {
    await this.set('apiDomain', domain);
  }

  static async getUserId(): Promise<string | undefined> {
    return await this.get<string>('userId');
  }

  static async setUserId(userId: string): Promise<void> {
    await this.set('userId', userId);
  }
}
