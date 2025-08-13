import { useState, useCallback, useRef, useEffect } from 'react';
import type { PromptSpace, PromptSpacesApiResponse } from '../types/sidePanel';
import { CHROME_ACTIONS, INITIAL_SPACE_ID } from '../constants/sidePanel';

interface UsePromptSpacesReturn {
  promptSpaces: PromptSpace[];
  selectedPromptSpace: string;
  hasInitialized: boolean;
  setSelectedPromptSpace: (spaceId: string) => void;
  setHasInitialized: (value: boolean) => void;
  fetchPromptSpaces: () => Promise<void>;
  handlePromptSpaceChange: (spaceId: string) => void;
  findDefaultSpace: () => string | null;
}

interface UsePromptSpacesProps {
  onSpaceSelected?: (spaceId: string) => void;
}

export const usePromptSpaces = ({ onSpaceSelected }: UsePromptSpacesProps = {}): UsePromptSpacesReturn => {
  const [promptSpaces, setPromptSpaces] = useState<PromptSpace[]>([]);
  const [selectedPromptSpace, setSelectedPromptSpace] = useState<string>(INITIAL_SPACE_ID);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Timer 相關 refs
  const setDefaultSpaceTimerRef = useRef<number | null>(null);
  const lastSpaceIdRef = useRef<string | null>(null);

  // 清理 timer 的 effect
  useEffect(() => {
    return () => {
      if (setDefaultSpaceTimerRef.current) {
        clearTimeout(setDefaultSpaceTimerRef.current);
      }
    };
  }, []);

  const convertApiResponseToSpaces = useCallback((response: PromptSpacesApiResponse): PromptSpace[] => {
    if (!response.success || !response.data) return [];

    return [
      ...response.data.ownedSpaces.map(space => ({
        id: space.id,
        name: space.name,
        type: 'my' as const,
        defaultSpace: space.defaultSpace,
      })),
      ...response.data.sharedSpaces.map(sharedSpace => ({
        id: sharedSpace.space.id,
        name: sharedSpace.space.name,
        type: 'shared' as const,
        isReadOnly: sharedSpace.permission === 'view',
        defaultSpace: sharedSpace.space.defaultSpace,
      })),
    ];
  }, []);

  const findDefaultSpace = useCallback((): string | null => {
    const allSpaces = promptSpaces;
    const defaultSpace = allSpaces.find(space => space.defaultSpace === true);
    return defaultSpace ? defaultSpace.id : allSpaces.length > 0 ? allSpaces[0].id : null;
  }, [promptSpaces]);

  const selectInitialSpace = useCallback(
    (spaces: PromptSpace[], rawData: PromptSpacesApiResponse['data']) => {
      if (selectedPromptSpace !== INITIAL_SPACE_ID || spaces.length === 0) return;

      // Find default space from raw API data
      const allRawSpaces = [...(rawData?.ownedSpaces || []), ...(rawData?.sharedSpaces.map(s => s.space) || [])];

      const defaultSpace = allRawSpaces.find(space => space.defaultSpace === true);

      let selectedSpaceId: string;
      if (defaultSpace) {
        selectedSpaceId = defaultSpace.id;
      } else {
        selectedSpaceId = spaces[0].id;
      }

      setSelectedPromptSpace(selectedSpaceId);
      setHasInitialized(true);
      onSpaceSelected?.(selectedSpaceId);
    },
    [selectedPromptSpace, onSpaceSelected],
  );

  const fetchPromptSpaces = useCallback(async () => {
    try {
      const response = await new Promise<PromptSpacesApiResponse>(resolve => {
        chrome.runtime.sendMessage({ action: CHROME_ACTIONS.GET_PROMPT_SPACES }, res => resolve(res));
      });

      if (response && response.success && response.data) {
        const spaces = convertApiResponseToSpaces(response);
        setPromptSpaces(spaces);
        selectInitialSpace(spaces, response.data);
      } else {
        setHasInitialized(true);
      }
    } catch (error) {
      setHasInitialized(true);
    }
  }, [convertApiResponseToSpaces, selectInitialSpace]);

  // 輔助函式：本地儲存
  const saveToLocalStorage = useCallback((spaceId: string) => {
    if (spaceId !== INITIAL_SPACE_ID && spaceId !== '__loading__') {
      chrome.storage.local.set({ currentDefaultSpaceId: spaceId });
    }
  }, []);

  // 輔助函式：API 同步排程
  const scheduleApiSync = useCallback((spaceId: string) => {
    // 清除現有計時器
    if (setDefaultSpaceTimerRef.current) {
      clearTimeout(setDefaultSpaceTimerRef.current);
      setDefaultSpaceTimerRef.current = null;
    }

    // 設定新計時器
    if (spaceId !== INITIAL_SPACE_ID && spaceId !== '__loading__') {
      lastSpaceIdRef.current = spaceId;

      setDefaultSpaceTimerRef.current = setTimeout(() => {
        // 雙重檢查：確保用戶還在同一個 space
        if (lastSpaceIdRef.current === spaceId) {
          chrome.runtime.sendMessage(
            {
              action: CHROME_ACTIONS.SET_DEFAULT_SPACE,
              spaceId: spaceId,
            },
            () => {},
          );
        }

        setDefaultSpaceTimerRef.current = null;
      }, 10000); // 10 秒 = 10000ms
    }
  }, []);

  const handlePromptSpaceChange = useCallback(
    (spaceId: string) => {
      setSelectedPromptSpace(spaceId);

      // 立即儲存到本地（讓 context menu 可以立即使用）
      saveToLocalStorage(spaceId);

      // 設定延遲 API 同步（避免頻繁呼叫）
      scheduleApiSync(spaceId);
    },
    [saveToLocalStorage, scheduleApiSync],
  );

  return {
    promptSpaces,
    selectedPromptSpace,
    hasInitialized,
    setSelectedPromptSpace,
    setHasInitialized,
    fetchPromptSpaces,
    handlePromptSpaceChange,
    findDefaultSpace,
  };
};
