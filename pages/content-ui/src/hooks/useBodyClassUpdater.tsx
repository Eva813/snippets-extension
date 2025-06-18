import { useEffect } from 'react';

function useBodyClassUpdater(isAnimating: boolean, displayMode: 'overlay' | 'push', alignment: 'left' | 'right') {
  useEffect(() => {
    const targetBody = document.body;
    const PANEL_CLASS = 'panel-push-mode';
    const PANEL_MODE_ATTR = 'data-panel-mode';
    const PANEL_ALIGNMENT_ATTR = 'data-panel-alignment';

    // 保存原始狀態以便恢復
    const originalMode = targetBody.getAttribute(PANEL_MODE_ATTR);
    const originalAlignment = targetBody.getAttribute(PANEL_ALIGNMENT_ATTR);

    const updateBodyClasses = () => {
      if (isAnimating && displayMode === 'push') {
        // 使用更安全的方式添加類別，避免覆蓋現有樣式
        targetBody.classList.add(PANEL_CLASS);
        targetBody.setAttribute(PANEL_MODE_ATTR, 'push');
        targetBody.setAttribute(PANEL_ALIGNMENT_ATTR, alignment);
      } else {
        // 只有在我們添加的情況下才移除
        targetBody.classList.remove(PANEL_CLASS);

        // 恢復原始屬性值，如果沒有原始值則移除
        if (originalMode !== null) {
          targetBody.setAttribute(PANEL_MODE_ATTR, originalMode);
        } else {
          targetBody.removeAttribute(PANEL_MODE_ATTR);
        }

        if (originalAlignment !== null) {
          targetBody.setAttribute(PANEL_ALIGNMENT_ATTR, originalAlignment);
        } else {
          targetBody.removeAttribute(PANEL_ALIGNMENT_ATTR);
        }
      }
    };

    // 使用 requestAnimationFrame 確保 DOM 更新在下一個渲染幀
    const frame = requestAnimationFrame(updateBodyClasses);

    return () => {
      // 清理：取消 animationFrame 並恢復原始狀態
      cancelAnimationFrame(frame);

      // 安全地移除我們添加的類別
      targetBody.classList.remove(PANEL_CLASS);

      // 恢復原始屬性
      if (originalMode !== null) {
        targetBody.setAttribute(PANEL_MODE_ATTR, originalMode);
      } else {
        targetBody.removeAttribute(PANEL_MODE_ATTR);
      }

      if (originalAlignment !== null) {
        targetBody.setAttribute(PANEL_ALIGNMENT_ATTR, originalAlignment);
      } else {
        targetBody.removeAttribute(PANEL_ALIGNMENT_ATTR);
      }
    };
  }, [isAnimating, displayMode, alignment]);
}

export default useBodyClassUpdater;
