import { getCursorInfo } from '@src/cursor/getCursorInfo';
import { generateElementPath, isEditableElement } from '@src/utils//utils';

// 初始化游標追蹤
export function initializeCursorTracker() {
  document.addEventListener('click', handleElementClick);
  // 新增：監聽按鍵事件 (捕捉方向鍵移動游標的情況)
  // document.addEventListener('keyup', handleKeyUp);

  // 新增：監聽選取事件
  // document.addEventListener('selectionchange', handleSelectionChange);

  console.log('游標追蹤已啟動');
}

// 處理點擊事件
function handleElementClick(event: MouseEvent) {
  const target = event.target as HTMLElement;

  if (!target) return;

  if (isEditableElement(target)) {
    // 延遲執行以確保瀏覽器已處理選取狀態
    setTimeout(() => updateCursorPosition(target), 200);
  }
}

// 新增：處理按鍵事件
// function handleKeyUp(event: KeyboardEvent) {
//   // 只處理可能改變游標位置的按鍵 (方向鍵、Home、End、PageUp、PageDown)
//   const cursorMovementKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];

//   if (cursorMovementKeys.indexOf(event.key) !== -1) {
//     const target = event.target as HTMLElement;
//     if (!target || !isEditableElement(target)) return;

//     updateCursorPosition(target);
//   }
// }

// // 新增：處理選取範圍變更事件
// function handleSelectionChange() {
//   const activeElement = document.activeElement as HTMLElement;
//   if (!activeElement || !isEditableElement(activeElement)) return;

//   // 使用 requestAnimationFrame 確保在 DOM 更新後再處理
//   requestAnimationFrame(() => {
//     updateCursorPosition(activeElement);
//   });
// }

// 更新游標位置資訊
export function updateCursorPosition(element: HTMLElement) {
  const { start, end } = getCursorInfo(element);

  chrome.storage.local.set({
    cursorPosition: {
      start,
      end,
      elementPath: generateElementPath(element),
    },
  });

  console.log('游標位置已更新:', { start, end });
}
