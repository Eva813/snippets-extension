// 集中化的預設空間 ID 選擇邏輯

// 定義空間資料結構
interface PromptSpaceData {
  id: string;
  name: string;
  defaultSpace?: boolean;
}

interface SharedSpaceData {
  space: PromptSpaceData;
}

interface PromptSpacesData {
  ownedSpaces: PromptSpaceData[];
  sharedSpaces: SharedSpaceData[];
}

interface CachedPromptSpaces {
  ownedSpaces?: PromptSpaceData[];
  sharedSpaces?: SharedSpaceData[];
}

/**
 * 從 API 資料中取得預設空間 ID
 */
export function getDefaultSpaceIdFromApiData(data: PromptSpacesData): string | null {
  // 優先選擇 ownedSpaces 中的第一個
  if (data.ownedSpaces && data.ownedSpaces.length > 0) {
    return data.ownedSpaces[0].id;
  }

  // 其次選擇 sharedSpaces 中的第一個
  if (data.sharedSpaces && data.sharedSpaces.length > 0) {
    return data.sharedSpaces[0].space.id;
  }

  return null;
}

/**
 * 從快取的空間資料中取得預設空間 ID
 */
export async function getDefaultSpaceIdFromCache(): Promise<string | null> {
  try {
    const { promptSpaces } = await chrome.storage.local.get(['promptSpaces']);
    const cachedData = promptSpaces as CachedPromptSpaces | undefined;

    if (!cachedData) {
      return null;
    }

    // 優先選擇 ownedSpaces 中的第一個
    if (cachedData.ownedSpaces && cachedData.ownedSpaces.length > 0) {
      return cachedData.ownedSpaces[0].id;
    }

    // 其次選擇 sharedSpaces 中的第一個
    if (cachedData.sharedSpaces && cachedData.sharedSpaces.length > 0) {
      return cachedData.sharedSpaces[0].space.id;
    }

    return null;
  } catch (error) {
    console.error('Error getting default space ID from cache:', error);
    return null;
  }
}
