/**
 * 更新 body 的 CSS 類別的自定義 Hook
 */
import { useEffect } from 'react';

function useBodyClassUpdater(isAnimating: boolean, displayMode: 'overlay' | 'push', alignment: 'left' | 'right') {
  useEffect(() => {
    const targetBody = document.body;

    const updateBodyClasses = () => {
      if (isAnimating && displayMode === 'push') {
        targetBody.classList.add('panel-push-mode');
        if (alignment === 'right') {
          targetBody.classList.add('panel-push-right');
          targetBody.classList.remove('panel-push-left');
        } else {
          targetBody.classList.add('panel-push-left');
          targetBody.classList.remove('panel-push-right');
        }
        targetBody.dataset.panelMode = 'push';
        targetBody.dataset.panelAlignment = alignment;
      } else {
        targetBody.classList.remove('panel-push-mode', 'panel-push-right', 'panel-push-left');
        delete targetBody.dataset.panelMode;
        delete targetBody.dataset.panelAlignment;
      }
    };

    // 更新 body class
    updateBodyClasses();

    return () => {
      // 清理副作用：移除所有相關的 class
      targetBody.classList.remove('panel-push-mode', 'panel-push-right', 'panel-push-left');
    };
  }, [isAnimating, displayMode, alignment]);
}

export default useBodyClassUpdater;
