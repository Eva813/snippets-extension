import { useState, useRef, useCallback } from 'react';
import SidePanel from './sidePanel';
import useBodyClassUpdater from '@src/hooks/useBodyClassUpdater';
import useToggleSlidePanelListener from '@src/hooks/useToggleSlidePanelListener';

export default function App() {
  // 顯示與動畫控制
  const [visible, setVisible] = useState(false);
  const [isInDOM, setIsInDOM] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const noAnimation = false; // 固定為 false，因為不再需要動態切換

  // 固定設定：右側對齊，push 模式
  const alignment = 'right';
  const displayMode = 'push';

  const sidebarTimerRef = useRef<number | null>(null);

  //  Hooks
  useBodyClassUpdater(isAnimating, displayMode, alignment);
  useToggleSlidePanelListener(setVisible, setIsInDOM, setIsAnimating);

  // 簡化的 toggle 函式
  const toggleSidebar = useCallback(() => {
    if (sidebarTimerRef.current !== null) {
      clearTimeout(sidebarTimerRef.current);
      sidebarTimerRef.current = null;
    }

    setIsAnimating(false);

    sidebarTimerRef.current = window.setTimeout(() => {
      setVisible(false);
      setIsInDOM(false);
      sidebarTimerRef.current = null;
    }, 300);
  }, []);

  return (
    <div>
      <SidePanel
        alignment={alignment}
        visible={visible}
        displayMode={displayMode}
        isInDOM={isInDOM}
        isAnimating={isAnimating}
        noAnimation={noAnimation}
        setIsInDOM={setIsInDOM}
        onToggle={toggleSidebar}
      />
    </div>
  );
}
