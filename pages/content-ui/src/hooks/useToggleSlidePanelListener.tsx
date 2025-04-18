/**
 * 監聽滑動面板切換訊息的自定義 Hook
 */

interface BackgroundMessage {
  action: string;
}

import { useEffect } from 'react';
function useToggleSlidePanelListener(
  setVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setIsInDOM: React.Dispatch<React.SetStateAction<boolean>>,
  setIsAnimating: React.Dispatch<React.SetStateAction<boolean>>,
) {
  useEffect(() => {
    const messageListener = (msg: BackgroundMessage) => {
      if (msg.action === 'toggleSlidePanel') {
        setVisible(prevVisible => {
          const willShow = !prevVisible;
          if (willShow) {
            // 插入 DOM，並觸發滑入動畫
            setIsInDOM(true);
            requestAnimationFrame(() => {
              setIsAnimating(true);
            });
          } else {
            // 隱藏動畫
            setIsAnimating(false);
          }
          return willShow;
        });
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [setVisible, setIsInDOM, setIsAnimating]);
}

export default useToggleSlidePanelListener;
