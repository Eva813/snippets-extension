import { useState, useCallback } from 'react';
import type { Folder, FoldersApiResponse } from '../types/sidePanel';
import { CHROME_ACTIONS, ERROR_MESSAGES } from '../constants/sidePanel';

interface UseFoldersReturn {
  folders: Folder[];
  isLoading: boolean;
  loadError: string | null;
  setFolders: (folders: Folder[]) => void;
  setIsLoading: (loading: boolean) => void;
  setLoadError: (error: string | null) => void;
  fetchFoldersForSpace: (promptSpaceId: string) => Promise<void>;
  clearFolders: () => void;
}

export const useFolders = (): UseFoldersReturn => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const clearFolders = useCallback(() => {
    setFolders([]);
    setLoadError(null);
  }, []);

  const fetchFoldersForSpace = useCallback(async (promptSpaceId: string) => {
    setIsLoading(true);
    setLoadError(null);

    try {
      chrome.runtime.sendMessage(
        {
          action: CHROME_ACTIONS.GET_SPACE_FOLDERS,
          promptSpaceId,
        },
        (response: FoldersApiResponse) => {
          setIsLoading(false);

          if (response && response.success && response.data) {
            setFolders(response.data);
          } else {
            const errorMsg = response?.error || ERROR_MESSAGES.FAILED_TO_FETCH_FOLDERS;
            console.error('Failed to fetch folders for space:', errorMsg);
            setLoadError(errorMsg);
            setFolders([]);
          }
        },
      );
    } catch (error) {
      setIsLoading(false);
      const errorMsg = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      setLoadError(errorMsg);
      console.error('Error occurred while loading folders for space:', error);
    }
  }, []);

  return {
    folders,
    isLoading,
    loadError,
    setFolders,
    setIsLoading,
    setLoadError,
    fetchFoldersForSpace,
    clearFolders,
  };
};
