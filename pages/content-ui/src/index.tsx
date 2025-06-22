import { createRoot } from 'react-dom/client';
import App from '@src/App';
import tailwindcssOutput from '../dist/tailwind-output.css?inline';
import globalStyles from './global-styles.css?inline';
import { getInitializationDelay, idleInitialize } from '@extension/shared/lib/utils/pageUtils';

// 安全地建立和管理 content-ui 根元素
const createSafeRoot = (): HTMLElement | null => {
  try {
    // 檢查是否已存在根元素
    let root = document.getElementById('chrome-extension-promptbear-react-vite-content-view-root');

    if (!root) {
      root = document.createElement('div');
      root.id = 'chrome-extension-promptbear-react-vite-content-view-root';

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

// 初始化和渲染應用
const initializeContentUI = (): void => {
  try {
    // 建立安全的根元素
    const root = createSafeRoot();
    if (!root) {
      console.error('無法建立根元素，停止初始化 Content UI');
      return;
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

    // 安全地添加樣式到 Shadow DOM（包含 Tailwind 和自定義樣式）
    const addShadowStyles = (): boolean => {
      try {
        // 合併 Tailwind 和自定義樣式
        const combinedStyles = tailwindcssOutput + '\n' + globalStyles;

        if (navigator.userAgent.includes('Firefox')) {
          // Firefox 環境：直接注入樣式
          const styleElement = document.createElement('style');
          styleElement.textContent = combinedStyles;
          shadowRoot.appendChild(styleElement);
          return true;
        } else {
          // 其他瀏覽器：使用 CSSStyleSheet（帶錯誤處理）
          try {
            const globalStyleSheet = new CSSStyleSheet();
            globalStyleSheet.replaceSync(combinedStyles);
            shadowRoot.adoptedStyleSheets = [globalStyleSheet];
            return true;
          } catch (cssError) {
            console.warn('CSSStyleSheet API 失敗，改用 style 元素:', cssError);
            // Fallback 到 style 元素
            const styleElement = document.createElement('style');
            styleElement.textContent = combinedStyles;
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

// 在安全時機使用共用的 idleInitialize（UI 延遲兩倍）
const uiDelay = getInitializationDelay() * 2;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => idleInitialize(initializeContentUI, uiDelay));
} else {
  idleInitialize(initializeContentUI, uiDelay);
}
