import type { Folder } from '../types/sidePanel';
import { CHROME_ACTIONS, ERROR_MESSAGES, CSS_CLASSES } from '../constants/sidePanel';

/**
 * Insert a prompt by ID
 */
export const insertPrompt = (folders: Folder[], id: string, event: React.MouseEvent): void => {
  if (event && event.preventDefault) {
    event.preventDefault();
    event.stopPropagation();
  }

  const prompt = folders.flatMap(folder => folder.prompts).find(prompt => prompt.id === id);
  if (!prompt) {
    console.warn(ERROR_MESSAGES.PROMPT_NOT_FOUND);
    return;
  }

  // Check if prompt.content contains 'data-prompt'
  const hasFormField = prompt.content.includes('data-prompt');
  const title = `${prompt.shortcut} - ${prompt.name}`;

  if (!hasFormField) {
    // No form fields, send message to background
    chrome.runtime.sendMessage(
      {
        action: CHROME_ACTIONS.SIDE_PANEL_INSERT_PROMPT,
        prompt: {
          content: prompt.content,
          shortcut: prompt.shortcut,
          name: prompt.name,
        },
      },
      () => {},
    );
  } else {
    // Has form fields, create popup via background
    const content = prompt.content;
    chrome.runtime.sendMessage(
      {
        action: CHROME_ACTIONS.CREATE_WINDOW,
        title,
        content,
      },
      response => {
        if (import.meta.env.MODE === 'development') {
          console.log('Window creation response:', response);
        }
      },
    );
  }
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
    classes.push('visible', 'bg-white');
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
