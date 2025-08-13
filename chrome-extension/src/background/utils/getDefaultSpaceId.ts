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
 * 優先尋找真正標記為 defaultSpace: true 的空間
 */
export function getDefaultSpaceIdFromApiData(data: PromptSpacesData): string | null {
  // 1. 在 ownedSpaces 中尋找 defaultSpace: true
  const ownedDefault = data.ownedSpaces?.find(space => space.defaultSpace === true);
  if (ownedDefault) {
    console.log('🎯 Found default owned space:', ownedDefault.name, ownedDefault.id);
    return ownedDefault.id;
  }

  // 2. 回退：選擇第一個可用的 owned space
  if (data.ownedSpaces && data.ownedSpaces.length > 0) {
    console.log('⚠️ No default space marked, using first owned space:', data.ownedSpaces[0].name);
    return data.ownedSpaces[0].id;
  }

  // 3. 最後回退：選擇第一個 shared space（僅作為臨時目標，不是真正的 default）
  if (data.sharedSpaces && data.sharedSpaces.length > 0) {
    console.log('⚠️ No owned spaces, using first shared space as fallback:', data.sharedSpaces[0].space.name);
    return data.sharedSpaces[0].space.id;
  }

  return null;
}

/**
 * 從快取的空間資料中取得預設空間 ID
 * 優先尋找真正標記為 defaultSpace: true 的空間
 */
export async function getDefaultSpaceIdFromCache(): Promise<string | null> {
  try {
    const { promptSpaces } = await chrome.storage.local.get(['promptSpaces']);
    const cachedData = promptSpaces as CachedPromptSpaces | undefined;

    if (!cachedData) {
      return null;
    }

    // 1. 在 ownedSpaces 中尋找 defaultSpace: true
    const ownedDefault = cachedData.ownedSpaces?.find(space => space.defaultSpace === true);
    if (ownedDefault) {
      console.log('🎯 Found cached default owned space:', ownedDefault.name, ownedDefault.id);
      return ownedDefault.id;
    }

    // 2. 回退：選擇第一個可用的 owned space
    if (cachedData.ownedSpaces && cachedData.ownedSpaces.length > 0) {
      console.log('⚠️ No cached default space marked, using first owned space:', cachedData.ownedSpaces[0].name);
      return cachedData.ownedSpaces[0].id;
    }

    // 3. 最後回退：選擇第一個 shared space（僅作為臨時目標，不是真正的 default）
    if (cachedData.sharedSpaces && cachedData.sharedSpaces.length > 0) {
      console.log(
        '⚠️ No cached owned spaces, using first shared space as fallback:',
        cachedData.sharedSpaces[0].space.name,
      );
      return cachedData.sharedSpaces[0].space.id;
    }

    return null;
  } catch (error) {
    console.error('Error getting default space ID from cache:', error);
    return null;
  }
}
