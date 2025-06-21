import { useState, useRef, useCallback } from 'react';
import SidePanel from './sidePanel';
import useContainerClassUpdater from '@src/hooks/useContainerClassUpdater';
import useToggleSlidePanelListener from '@src/hooks/useToggleSlidePanelListener';

export default function App() {
  // 顯示與動畫控制
  const [visible, setVisible] = useState(false);
  const [isInDOM, setIsInDOM] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const noAnimation = false; // 固定為 false，因為不再需要動態切換

  // 目前預設：右側對齊，push／overlay 模式
  const alignment = 'right';
  const [displayMode, setDisplayMode] = useState<'push' | 'overlay'>('push');
  const toggleDisplayMode = useCallback(() => {
    setDisplayMode(prev => (prev === 'push' ? 'overlay' : 'push'));
  }, []);

  const sidebarTimerRef = useRef<number | null>(null);

  //  Hooks
  const containerRef = useContainerClassUpdater(isAnimating, displayMode, alignment);
  useToggleSlidePanelListener(setVisible, setIsInDOM, setIsAnimating);

  const toggleSidebar = useCallback(() => {
    if (sidebarTimerRef.current !== null) {
      clearTimeout(sidebarTimerRef.current);
      sidebarTimerRef.current = null;
    }

    // 開始關閉動畫
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
        toggleDisplayMode={toggleDisplayMode}
        containerRef={containerRef}
      />
    </div>
  );
}
