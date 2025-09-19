import { type PromptSpacesResponse, type PromptSpace } from '../utils/fetchPromptSpaces';
import { type FolderData } from '../utils/fetchSpaceFolders';

/**
 * 合併所有可用的空間（owned + shared）
 */
export function getAllAvailableSpaces(spacesData: PromptSpacesResponse): PromptSpace[] {
  return [...spacesData.ownedSpaces, ...spacesData.sharedSpaces.map(s => s.space)];
}

/**
 * 驗證指定的空間 ID 是否在可用空間列表中
 */
export function isSpaceValid(spaceId: string, availableSpaces: PromptSpace[]): boolean {
  return availableSpaces.some(space => space.id === spaceId);
}

/**
 * 選擇最佳資料夾
 * 目前簡單選擇第一個，後續可以添加更智能的邏輯
 * 例如：優先選擇最近使用的、或特定命名的資料夾
 */
export function selectBestFolder(folders: FolderData[]): FolderData {
  return folders[0];
}
