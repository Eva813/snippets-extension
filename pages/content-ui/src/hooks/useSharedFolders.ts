import { useState, useCallback, useEffect } from 'react';
import { CHROME_ACTIONS, SHARED_ERROR_MESSAGES } from '../constants/sidePanel';
import type {
  SharedFolderItem,
  SharedFoldersResponse,
  SharedFolderDetailResponse,
  PublicFolderResponse,
} from '../types/sidePanel';

interface UseSharedFoldersReturn {
  sharedFolders: SharedFolderItem[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  fetchSharedFolders: () => Promise<void>;
  refreshSharedFolders: () => Promise<void>;
  getSharedFolderDetails: (folderId: string) => Promise<SharedFolderDetailResponse | null>;
  getPublicFolder: (shareToken: string) => Promise<PublicFolderResponse | null>;
  clearError: () => void;
}

export const useSharedFolders = (): UseSharedFoldersReturn => {
  const [sharedFolders, setSharedFolders] = useState<SharedFolderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchSharedFolders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await new Promise<{
        success: boolean;
        data?: SharedFoldersResponse;
        error?: string;
      }>(resolve => {
        chrome.runtime.sendMessage({ action: CHROME_ACTIONS.GET_SHARED_FOLDERS }, res => resolve(res));
      });

      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }

      if (response.success && response.data) {
        setSharedFolders(response.data.folders);
      } else {
        setError(response.error || SHARED_ERROR_MESSAGES.FAILED_TO_FETCH_SHARED_FOLDERS);
        setSharedFolders([]);
      }
    } catch (err) {
      console.error('Error fetching shared folders:', err);
      setError(err instanceof Error ? err.message : SHARED_ERROR_MESSAGES.FAILED_TO_FETCH_SHARED_FOLDERS);
      setSharedFolders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSharedFolders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await new Promise<{
        success: boolean;
        data?: SharedFoldersResponse;
        error?: string;
      }>(resolve => {
        chrome.runtime.sendMessage({ action: CHROME_ACTIONS.REFRESH_SHARED_FOLDERS }, res => resolve(res));
      });

      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }

      if (response.success && response.data) {
        setSharedFolders(response.data.folders);
      } else {
        setError(response.error || SHARED_ERROR_MESSAGES.FAILED_TO_FETCH_SHARED_FOLDERS);
      }
    } catch (err) {
      console.error('Error refreshing shared folders:', err);
      setError(err instanceof Error ? err.message : SHARED_ERROR_MESSAGES.FAILED_TO_FETCH_SHARED_FOLDERS);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSharedFolderDetails = useCallback(async (folderId: string): Promise<SharedFolderDetailResponse | null> => {
    try {
      const response = await new Promise<{
        success: boolean;
        data?: SharedFolderDetailResponse;
        error?: string;
      }>(resolve => {
        chrome.runtime.sendMessage({ action: CHROME_ACTIONS.GET_SHARED_FOLDER_DETAILS, folderId }, res => resolve(res));
      });

      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }

      if (response.success && response.data) {
        return response.data;
      } else {
        console.error('Failed to fetch shared folder details:', response.error);
        return null;
      }
    } catch (err) {
      console.error('Error fetching shared folder details:', err);
      return null;
    }
  }, []);

  const getPublicFolder = useCallback(async (shareToken: string): Promise<PublicFolderResponse | null> => {
    try {
      const response = await new Promise<{
        success: boolean;
        data?: PublicFolderResponse;
        error?: string;
      }>(resolve => {
        chrome.runtime.sendMessage({ action: CHROME_ACTIONS.GET_PUBLIC_FOLDER, shareToken }, res => resolve(res));
      });

      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }

      if (response.success && response.data) {
        return response.data;
      } else {
        console.error('Failed to fetch public folder:', response.error);
        return null;
      }
    } catch (err) {
      console.error('Error fetching public folder:', err);
      return null;
    }
  }, []);

  // 初始載入
  useEffect(() => {
    fetchSharedFolders();
  }, [fetchSharedFolders]);

  return {
    sharedFolders,
    loading,
    error,
    totalCount: sharedFolders.length,
    fetchSharedFolders,
    refreshSharedFolders,
    getSharedFolderDetails,
    getPublicFolder,
    clearError,
  };
};

// Hook for getting shared folders count only (lightweight)
export const useSharedFoldersCount = () => {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchCount = useCallback(async () => {
    setLoading(true);
    try {
      const response = await new Promise<{
        success: boolean;
        data?: SharedFoldersResponse;
        error?: string;
      }>(resolve => {
        chrome.runtime.sendMessage({ action: CHROME_ACTIONS.GET_SHARED_FOLDERS }, res => resolve(res));
      });

      if (chrome.runtime.lastError) {
        return;
      }

      if (response.success && response.data) {
        setCount(response.data.total);
      }
    } catch (err) {
      console.error('Error fetching shared folders count:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return { count, loading, refetch: fetchCount };
};
