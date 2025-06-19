import { useState, useRef, useCallback, useEffect } from 'react';
import SidePanel from './sidePanel';
import useContainerClassUpdater from '@src/hooks/useContainerClassUpdater';
import useToggleSlidePanelListener from '@src/hooks/useToggleSlidePanelListener';

export default function App() {
  // 顯示與動畫控制
  const [visible, setVisible] = useState(false);
  const [isInDOM, setIsInDOM] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const noAnimation = false; // 固定為 false，因為不再需要動態切換

  // 目前固定設定：右側對齊，push／overlay 模式
  const alignment = 'right';
  // displayMode 狀態與切換函式
  const [displayMode, setDisplayMode] = useState<'push' | 'overlay'>('push');
  const toggleDisplayMode = useCallback(() => {
    setDisplayMode(prev => (prev === 'push' ? 'overlay' : 'push'));
  }, []);

  const sidebarTimerRef = useRef<number | null>(null);

  useEffect(() => {
    console.log('App 狀態變化:', { visible, isInDOM, isAnimating, displayMode, alignment });
  }, [visible, isInDOM, isAnimating, displayMode, alignment]);

  //  Hooks
  const containerRef = useContainerClassUpdater(isAnimating, displayMode, alignment);
  useToggleSlidePanelListener(setVisible, setIsInDOM, setIsAnimating);

  // 簡化的 toggle 函式
  const toggleSidebar = useCallback(() => {
    console.log('toggleSidebar 被呼叫，目前狀態:', { visible, isAnimating });

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
  }, [visible, isAnimating]);

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
        // 新增切換顯示模式函式
        toggleDisplayMode={toggleDisplayMode}
        containerRef={containerRef}
      />
    </div>
  );
}
