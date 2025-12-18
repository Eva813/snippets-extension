import type { Folder, Prompt, PromptItem } from '../types/sidePanel';
import { CHROME_ACTIONS, ERROR_MESSAGES, CSS_CLASSES } from '../constants/sidePanel';
import { hasFormField } from '@extension/shared/lib/utils/formFieldDetector';

/**
 * Core function to handle prompt insertion logic
 * Handles event processing, form field detection, and message sending
 */
const handleInsertPrompt = (promptData: Prompt | PromptItem, title: string, event: React.MouseEvent): void => {
  if (event && event.preventDefault) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Create a compatible object for hasFormField function
  const formFieldCheckData = {
    content: promptData.content,
    contentJSON: promptData.contentJSON,
    shortcut: promptData.shortcut || '',
    name: promptData.name,
  };

  if (!hasFormField(formFieldCheckData)) {
    // No form fields, send message to background
    chrome.runtime.sendMessage(
      {
        action: CHROME_ACTIONS.SIDE_PANEL_INSERT_PROMPT,
        prompt: {
          content: promptData.content,
          contentJSON: promptData.contentJSON,
          shortcut: promptData.shortcut || '',
          name: promptData.name,
        },
      },
      () => {},
    );
  } else {
    // Has form fields, create popup via background
    chrome.runtime.sendMessage(
      {
        action: CHROME_ACTIONS.CREATE_WINDOW,
        title,
        content: promptData.content,
        contentJSON: promptData.contentJSON,
      },
      response => {
        if (import.meta.env.MODE === 'development') {
          console.log('Window creation response ,dev:', response);
        }
      },
    );
  }
};

/**
 * Insert a prompt by ID
 */
export const insertPrompt = (folders: Folder[], id: string, event: React.MouseEvent): void => {
  const prompt = folders.flatMap(folder => folder.prompts).find(prompt => prompt.id === id);
  if (!prompt) {
    console.warn(ERROR_MESSAGES.PROMPT_NOT_FOUND);
    return;
  }

  const title = `${prompt.shortcut} - ${prompt.name}`;

  handleInsertPrompt(prompt, title, event);
};

/**
 * Insert a shared prompt directly from shared folder data
 */
export const insertSharedPrompt = (prompt: PromptItem, event: React.MouseEvent): void => {
  if (!prompt) {
    console.warn('No prompt provided to insertSharedPrompt');
    return;
  }

  const title = `${prompt.shortcut || 'Shared'} - ${prompt.name}`;

  handleInsertPrompt(prompt, title, event);
};

/**
 * Generate CSS classes for the panel
 */
export const generatePanelClasses = (
  alignment: 'left' | 'right',
  visible: boolean,
  isAnimating: boolean,
  noAnimation: boolean,
): string => {
  const classes: string[] = [
    CSS_CLASSES.EXTENSION_CONTAINER,
    CSS_CLASSES.SLIDE_PANEL,
    CSS_CLASSES.OVERFLOW_VISIBLE,
    alignment,
  ];

  if (visible && isAnimating) {
    classes.push('visible', 'dark');
  }

  if (noAnimation) {
    classes.push('no-animation');
  }

  return classes.join(' ');
};

/**
 * Open dashboard in new tab
 */
export const openDashboard = (url: string): void => {
  window.open(url, '_blank');
};
