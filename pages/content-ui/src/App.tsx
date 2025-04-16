import { useState, useRef, useCallback, useMemo } from 'react';
// import { Button } from '@extension/ui';
// import { useStorage } from '@extension/shared';
// import { exampleThemeStorage } from '@extension/storage';
// const theme = useStorage(exampleThemeStorage);
import SidePanel from './sidePanel';
import SidebarOptions from '@src/components/sidebarOptions';
import useBodyClassUpdater from '@src/hooks/useBodyClassUpdater';
import useToggleSlidePanelListener from '@src/hooks/useToggleSlidePanelListener';

export default function App() {
  // 顯示與動畫控制
  const [visible, setVisible] = useState(false);
  const [isInDOM, setIsInDOM] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [noAnimation, setNoAnimation] = useState(false);

  // 對齊與顯示模式
  const [alignment, setAlignment] = useState<'left' | 'right'>('right');
  const [displayMode, setDisplayMode] = useState<'overlay' | 'push'>('overlay');

  // 滑鼠狀態
  const [hoveredPanel, setHoveredPanel] = useState<HTMLElement | null>(null);
  const [isOptionsHovered, setIsOptionsHovered] = useState(false);

  const sidebarOptionsRef = useRef<HTMLDivElement>(null);
  const sidebarTimerRef = useRef<number | null>(null);

  //  Hooks
  useBodyClassUpdater(isAnimating, displayMode, alignment);
  useToggleSlidePanelListener(setVisible, setIsInDOM, setIsAnimating);

  // 事件 Callback
  const handleHover = useCallback((panel: HTMLElement | null) => {
    setHoveredPanel(panel);
  }, []);

  const handleOptionMouseEnter = useCallback(() => {
    setIsOptionsHovered(true);
  }, []);

  const handleOptionMouseLeave = useCallback(() => {
    setIsOptionsHovered(false);
  }, []);

  const toggleDisplayMode = useCallback(() => {
    setDisplayMode(prev => (prev === 'overlay' ? 'push' : 'overlay'));
  }, []);

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

  const toggleAlignment = useCallback(() => {
    setIsAnimating(false);
    setNoAnimation(true);

    setAlignment(prev => (prev === 'left' ? 'right' : 'left'));

    requestAnimationFrame(() => {
      setNoAnimation(false);
      if (visible) {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      }
    });

    setHoveredPanel(null);
    setIsOptionsHovered(false);
  }, [visible]);

  const showSidebarOptions = useMemo(() => {
    return Boolean(hoveredPanel) || isOptionsHovered;
  }, [hoveredPanel, isOptionsHovered]);

  return (
    <div>
      {showSidebarOptions && (
        <SidebarOptions
          alignment={alignment}
          displayMode={displayMode}
          toggleAlignment={toggleAlignment}
          toggleDisplayMode={toggleDisplayMode}
          panelRef={hoveredPanel}
          ref={sidebarOptionsRef}
          onMouseEnter={handleOptionMouseEnter}
          onMouseLeave={handleOptionMouseLeave}
        />
      )}
      <SidePanel
        alignment={alignment}
        visible={visible}
        isInDOM={isInDOM}
        isAnimating={isAnimating}
        noAnimation={noAnimation}
        setIsInDOM={setIsInDOM}
        setIsAnimating={setIsAnimating}
        toggleAlignment={toggleAlignment}
        onHover={handleHover}
        onToggle={toggleSidebar}
      />
    </div>
  );
}
