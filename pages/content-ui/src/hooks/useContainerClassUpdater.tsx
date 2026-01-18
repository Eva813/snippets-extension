import { useEffect, useRef } from 'react';

// 更新 extension container 的 CSS 類別
function useContainerClassUpdater(isAnimating: boolean, displayMode: 'overlay' | 'push', alignment: 'left' | 'right') {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 如果還沒有容器引用，嘗試獲取
    if (!containerRef.current) {
      // 在 Shadow DOM 中尋找 extension container
      const shadowHost = document.getElementById('chrome-extension-promptbear-react-vite-content-view-root');
      if (shadowHost?.shadowRoot) {
        containerRef.current = shadowHost.shadowRoot.querySelector('.extension-container');
      }
    }

    const container = containerRef.current;
    if (!container) {
      // 容器可能還沒準備好，靜默返回
      return;
    }

    // 保存 host body 的原始狀態
    const hostBody = document.body;
    const originalMarginRight = hostBody.style.marginRight;
    const originalMarginLeft = hostBody.style.marginLeft;
    const originalTransition = hostBody.style.transition;

    // 創建並注入必要的 CSS 樣式到主文件
    const injectPushStyles = () => {
      const existingStyle = document.getElementById('extension-push-styles');
      if (!existingStyle) {
        const style = document.createElement('style');
        style.id = 'extension-push-styles';
        style.textContent = `
          body.extension-push-active {
            transition: margin 0.3s ease-in-out !important;
          }
          body.extension-push-active.extension-push-right {
            margin-right: 300px !important;
          }
          body.extension-push-active.extension-push-left {
            margin-left: 300px !important;
          }
        `;
        document.head.appendChild(style);
      }
    };

    const updateContainerClasses = () => {
      const isDev = import.meta.env.MODE === 'development';
      if (isDev) {
        console.log('dev mode: 更新容器類別 - isAnimating:', isAnimating, 'displayMode:', displayMode);
      }

      container.classList.remove('push-mode', 'push-mode-right', 'push-mode-left', 'overlay-mode');
      // 清除 host body 的 extension 類別
      hostBody.classList.remove('extension-push-active', 'extension-push-right', 'extension-push-left');

      // 添加深色模式類別
      container.classList.add('dark');

      if (isAnimating) {
        if (displayMode === 'push') {
          // 確保注入 push 樣式
          injectPushStyles();

          // Push 模式：更新容器樣式並推動頁面
          container.classList.add('push-mode');
          container.classList.add(`push-mode-${alignment}`);

          // 安全地推動 host 頁面
          hostBody.classList.add('extension-push-active');
          hostBody.classList.add(`extension-push-${alignment}`);
        } else {
          // Overlay 模式：只更新容器樣式
          container.classList.add('overlay-mode');
        }
      } else {
        if (isDev) {
          console.log('dev mode: remove animation classes');
        }
      }
    };

    // 使用 requestAnimationFrame 確保在下一個渲染幀更新
    const frame = requestAnimationFrame(updateContainerClasses);

    return () => {
      cancelAnimationFrame(frame);

      // 清理：移除所有相關類別和樣式
      if (container) {
        container.classList.remove('push-mode', 'push-mode-right', 'push-mode-left', 'overlay-mode');
      }

      // 恢復 host body 的原始狀態
      hostBody.classList.remove('extension-push-active', 'extension-push-right', 'extension-push-left');

      // 恢復原始樣式（如果有的話）
      if (originalMarginRight) {
        hostBody.style.marginRight = originalMarginRight;
      } else {
        hostBody.style.removeProperty('margin-right');
      }

      if (originalMarginLeft) {
        hostBody.style.marginLeft = originalMarginLeft;
      } else {
        hostBody.style.removeProperty('margin-left');
      }

      if (originalTransition) {
        hostBody.style.transition = originalTransition;
      } else {
        hostBody.style.removeProperty('transition');
      }
    };
  }, [isAnimating, displayMode, alignment]);

  // 回傳 ref 供組件使用
  return containerRef;
}

export default useContainerClassUpdater;
