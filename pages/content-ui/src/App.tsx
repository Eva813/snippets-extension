import { useEffect, useState } from 'react';
// import { Button } from '@extension/ui';
// import { useStorage } from '@extension/shared';
// import { exampleThemeStorage } from '@extension/storage';
import SidePanel from './sidePanel';

export default function App() {
  // const theme = useStorage(exampleThemeStorage);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log('content ui loaded');

    // 監聽來自背景頁面的訊息
    interface ChromeMessage {
      action: string;
      [key: string]: unknown;
    }

    const messageListener = (msg: ChromeMessage) => {
      if (msg.action === 'toggleSlidePanel') {
        setIsVisible(prev => !prev);
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);

    // 清除監聽器
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  return (
    <div className={`slide-panel ${isVisible ? 'visible' : ''}`}>
      {/* <div className="flex gap-1 text-blue-500">
        Edit <strong className="text-blue-700">pages/content-ui/src/app.tsx</strong> and save to reload.
      </div>
      <Button theme={theme} onClick={exampleThemeStorage.toggle}>
        Toggle Theme
      </Button> */}
      <SidePanel />
    </div>
  );
}
