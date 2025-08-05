import { useEffect } from 'react';
import type { Folder, Prompt } from '../types/sidePanel';
import { CHROME_ACTIONS } from '../constants/sidePanel';

interface UsePromptStorageProps {
  folders: Folder[];
}

export const usePromptStorage = ({ folders }: UsePromptStorageProps): void => {
  useEffect(() => {
    const validFolders = Array.isArray(folders) ? folders : [];

    if (validFolders.length <= 0) {
      chrome.runtime.sendMessage({
        action: CHROME_ACTIONS.UPDATE_ICON,
        hasFolders: false,
      });
      return;
    }

    chrome.runtime.sendMessage({
      action: CHROME_ACTIONS.UPDATE_ICON,
      hasFolders: true,
    });

    // Check if prompts need to be updated (avoid duplicate updates)
    chrome.storage.local.get(['prompts'], result => {
      const promptsMap = validFolders.reduce<Record<string, Prompt>>((acc, folder) => {
        folder.prompts.forEach(prompt => {
          acc[prompt.shortcut] = prompt;
        });
        return acc;
      }, {});

      // Only update if prompts have changed
      const currentPromptsString = JSON.stringify(result.prompts || {});
      const newPromptsString = JSON.stringify(promptsMap);

      if (currentPromptsString !== newPromptsString) {
        chrome.storage.local.set({ prompts: promptsMap }, () => {
          if (import.meta.env.MODE === 'development') {
            console.log('dev mode: Prompts saved to storage,', promptsMap);
          }
        });
      }
    });
  }, [folders]);
};
