import './messageHandler';
import { initializeSnippetManager } from '@src/snippet/snippetManager';
import { initializeCursorTracker } from '@src/cursor/cursorTracker';
import { initializeInputHandler } from '@src/input/inputHandler';

// 初始化應用程式
async function initialize() {
  await initializeSnippetManager();
  initializeCursorTracker();
  initializeInputHandler();
}
initialize();
