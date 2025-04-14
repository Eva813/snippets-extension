import { useEffect, useState, useRef } from 'react';
// import { Button } from '@extension/ui';
// import { useStorage } from '@extension/shared';
// import { exampleThemeStorage } from '@extension/storage';
import SidePanel from './sidePanel';
import SidebarOptions from '@src/components/sidebarOptions';

export default function App() {
  // const theme = useStorage(exampleThemeStorage);

  // 將原本在 SidePanel 的狀態提升到 App
  const [alignment, setAlignment] = useState<'left' | 'right'>('right');
  const [visible, setVisible] = useState(false);
  const [isInDOM, setIsInDOM] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [noAnimation, setNoAnimation] = useState(false);
  const [hoveredPanel, setHoveredPanel] = useState<HTMLElement | null>(null);
  const [hoveredOptions, setHoveredOptions] = useState<boolean>(false);
  const sidebarOptionsRef = useRef<HTMLDivElement>(null);

  const handleHover = (panel: HTMLElement | null) => {
    setHoveredPanel(panel);
  };
  // 新增 SidebarOptions 的滑鼠進入/離開處理函式
  const handleOptionMouseEnter = () => {
    setHoveredOptions(true);
  };

  const handleOptionMouseLeave = () => {
    setHoveredOptions(false);
  };

  // 切換面板對齊方向的邏輯也提升到 App
  const toggleAlignment = () => {
    // 先暫時關閉動畫
    setIsAnimating(false);
    setNoAnimation(true);

    // 切換 left / right
    setAlignment(prev => (prev === 'left' ? 'right' : 'left'));

    // 確保 DOM 更新完後，再關掉 no-animation
    requestAnimationFrame(() => {
      setNoAnimation(false);

      // 如果原本就處在「顯示」的狀態，需要再次加回 isAnimating=true
      if (visible) {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      }
    });

    // 點擊後隱藏 SidebarOptions
    setHoveredPanel(null);
    setHoveredOptions(false);
  };

  useEffect(() => {
    // 監聽來自背景頁面的訊息
    const messageListener = (msg: { action: string }) => {
      if (msg.action === 'toggleSlidePanel') {
        setVisible(prev => {
          const willShow = !prev;
          if (willShow) {
            // 1. 先插入 DOM
            setIsInDOM(true);
            // 2. 等待下一幀，再加上 .visible 觸發滑入
            requestAnimationFrame(() => {
              setIsAnimating(true);
            });
          } else {
            // 1. 先移除 .visible，讓它有滑出動畫
            setIsAnimating(false);
            // 2. 動畫結束後，再從 DOM 移除 (在 SidePanel 中)
          }
          return willShow;
        });
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  // 根據兩個懸停狀態決定是否顯示 SidebarOptions
  const showSidebarOptions = hoveredPanel || hoveredOptions;

  return (
    <div>
      {/* <div className="flex gap-1 text-blue-500">
        Edit <strong className="text-blue-700">pages/content-ui/src/app.tsx</strong> and save to reload.
      </div>
      <Button theme={theme} onClick={exampleThemeStorage.toggle}>
        Toggle Theme
      </Button> */}

      {showSidebarOptions && (
        <SidebarOptions
          alignment={alignment}
          toggleAlignment={toggleAlignment}
          panelRef={hoveredPanel}
          ref={sidebarOptionsRef}
          onMouseEnter={handleOptionMouseEnter}
          onMouseLeave={handleOptionMouseLeave}
        />
      )}

      {/* 將狀態和回呼函式傳遞給 SidePanel */}
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
      />
    </div>
  );
}
