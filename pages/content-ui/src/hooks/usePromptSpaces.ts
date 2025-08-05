import { useState, useCallback } from 'react';
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
      const response = await new Promise<PromptSpacesApiResponse>((resolve) => {
        chrome.runtime.sendMessage(
          { action: CHROME_ACTIONS.GET_PROMPT_SPACES },
          (res) => resolve(res)
        );
      });
      
      if (response && response.success && response.data) {
        const spaces = convertApiResponseToSpaces(response);
        setPromptSpaces(spaces);
        selectInitialSpace(spaces, response.data);
      } else {
        setHasInitialized(true);
      }
    } catch (error) {
      console.error('Error fetching prompt spaces:', error);
      setHasInitialized(true);
    }
  }, [convertApiResponseToSpaces, selectInitialSpace]);

  const handlePromptSpaceChange = useCallback((spaceId: string) => {
    console.log('Changing prompt space to:', spaceId);
    setSelectedPromptSpace(spaceId);
  }, []);

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
