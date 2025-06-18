import { createRoot } from 'react-dom/client';
import App from '@src/App';
import tailwindcssOutput from '../dist/tailwind-output.css?inline';
import globalStyles from './global-styles.css?inline';

// 延遲載入以避免干擾頁面的 React 水合過程
const INITIALIZATION_DELAY = 2000; // 2 秒延遲

// 檢查是否為 React 頁面
const isReactPage = (): boolean => {
  return !!(
    document.querySelector('[data-reactroot]') ||
    document.querySelector('script[src*="react"]') ||
    window.React ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__
  );
};

// 安全地建立和管理 content-ui 根元素
const createSafeRoot = (): HTMLElement | null => {
  try {
    // 檢查是否已存在根元素
    let root = document.getElementById('chrome-extension-boilerplate-react-vite-content-view-root');

    if (!root) {
      root = document.createElement('div');
      root.id = 'chrome-extension-boilerplate-react-vite-content-view-root';

      // 確保在 DOM 完全載入後添加
      if (document.body) {
        document.body.appendChild(root);
      } else {
        // 如果 body 還未準備好，等待 DOM 載入
        document.addEventListener('DOMContentLoaded', () => {
          if (document.body && !document.getElementById(root!.id)) {
            document.body.appendChild(root!);
          }
        });
      }
    }

    return root;
  } catch (error) {
    console.error('建立安全根元素失敗:', error);
    return null;
  }
};

// 建立一個獨特的標識符避免重複添加
const GLOBAL_STYLE_ID = 'chrome-extension-snippets-global-styles';

// 安全地添加全域樣式，包含錯誤處理
const addGlobalStyles = (): boolean => {
  try {
    // 檢查是否已經添加過全域樣式，避免重複注入
    if (document.getElementById(GLOBAL_STYLE_ID)) {
      return true;
    }

    // 確保 head 元素存在
    if (!document.head) {
      console.warn('Document head 不可用，跳過全域樣式注入');
      return false;
    }

    const globalStyle = document.createElement('style');
    globalStyle.id = GLOBAL_STYLE_ID;
    globalStyle.textContent = globalStyles;

    // 使用更安全的樣式添加方式
    try {
      document.head.appendChild(globalStyle);
    } catch (appendError) {
      console.error('附加全域樣式到 head 失敗:', appendError);
      return false;
    }

    // 監控樣式是否被移除（防止被頁面清理）
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.removedNodes.forEach(node => {
          if (node === globalStyle && document.head) {
            console.warn('Extension 全域樣式被移除，將重新注入');
            // 延遲重新注入，避免衝突
            setTimeout(() => {
              if (!document.getElementById(GLOBAL_STYLE_ID)) {
                addGlobalStyles();
              }
            }, 1000);
          }
        });
      });
    });

    // 只在 head 存在時監控
    if (document.head) {
      observer.observe(document.head, { childList: true });

      // 清理函式，在頁面卸載時執行
      const cleanup = () => {
        observer.disconnect();
        const styleElement = document.getElementById(GLOBAL_STYLE_ID);
        if (styleElement) {
          styleElement.remove();
        }
      };

      window.addEventListener('beforeunload', cleanup);

      // 監聽 extension context 失效
      if (chrome?.runtime?.onConnect) {
        chrome.runtime.onConnect.addListener(() => {
          if (!chrome?.runtime?.id) {
            cleanup();
          }
        });
      }
    }

    return true;
  } catch (error) {
    console.error('添加全域樣式失敗:', error);
    return false;
  }
};

// 初始化和渲染應用
const initializeContentUI = (): void => {
  try {
    // 建立安全的根元素
    const root = createSafeRoot();
    if (!root) {
      console.error('無法建立根元素，停止初始化 Content UI');
      return;
    }

    // 添加全域樣式
    if (!addGlobalStyles()) {
      console.warn('全域樣式添加失敗，但繼續初始化');
    }

    // 建立 Shadow DOM 容器
    const rootIntoShadow = document.createElement('div');
    rootIntoShadow.id = 'shadow-root';

    // 安全地建立 Shadow Root
    let shadowRoot: ShadowRoot;
    try {
      shadowRoot = root.attachShadow({ mode: 'open' });
    } catch (shadowError) {
      console.error('建立 Shadow DOM 失敗:', shadowError);
      // Fallback: 直接使用普通 DOM
      root.appendChild(rootIntoShadow);
      createRoot(rootIntoShadow).render(<App />);
      return;
    }

    // 安全地添加樣式到 Shadow DOM
    const addShadowStyles = (): boolean => {
      try {
        if (navigator.userAgent.includes('Firefox')) {
          // Firefox 環境：直接注入樣式
          const styleElement = document.createElement('style');
          styleElement.textContent = tailwindcssOutput;
          shadowRoot.appendChild(styleElement);
          return true;
        } else {
          // 其他瀏覽器：使用 CSSStyleSheet（帶錯誤處理）
          try {
            const globalStyleSheet = new CSSStyleSheet();
            globalStyleSheet.replaceSync(tailwindcssOutput);
            shadowRoot.adoptedStyleSheets = [globalStyleSheet];
            return true;
          } catch (cssError) {
            console.warn('CSSStyleSheet API 失敗，改用 style 元素:', cssError);
            // Fallback 到 style 元素
            const styleElement = document.createElement('style');
            styleElement.textContent = tailwindcssOutput;
            shadowRoot.appendChild(styleElement);
            return true;
          }
        }
      } catch (error) {
        console.error('添加 Shadow DOM 樣式失敗:', error);
        return false;
      }
    };

    // 添加樣式到 Shadow DOM
    if (!addShadowStyles()) {
      console.warn('Shadow DOM 樣式添加失敗，但繼續渲染');
    }

    // 添加容器並渲染應用
    shadowRoot.appendChild(rootIntoShadow);

    try {
      createRoot(rootIntoShadow).render(<App />);
    } catch (renderError) {
      console.error('React 應用渲染失敗:', renderError);
    }
  } catch (error) {
    console.error('Content UI 初始化失敗:', error);
  }
};

// 延遲初始化策略
const delayedInitializeContentUI = (): void => {
  // 如果是 React 頁面，使用更長的延遲
  const delay = isReactPage() ? INITIALIZATION_DELAY * 2 : INITIALIZATION_DELAY;

  console.log(`Content UI 將在 ${delay}ms 後初始化${isReactPage() ? ' (檢測到 React 頁面)' : ''}`);

  setTimeout(() => {
    // 再次檢查頁面是否穩定
    if (document.readyState === 'complete') {
      initializeContentUI();
    } else {
      // 如果頁面還在載入，等待完成
      window.addEventListener('load', () => {
        setTimeout(initializeContentUI, 500);
      });
    }
  }, delay);
};

// 確保在安全的時機初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', delayedInitializeContentUI);
} else {
  // DOM 已準備好，但仍然延遲初始化以避免干擾 React
  delayedInitializeContentUI();
}
