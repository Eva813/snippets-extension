import { createRoot } from 'react-dom/client';
import FormRoot from '@src/formRoot';
import tailwindcssOutput from '../dist/tailwind-output.css?inline';
import formRootCss from '../dist/formRoot.css?inline';

// 從文件中取得 #form-root 容器
const container = document.getElementById('form-root');
if (container) {
  // 建立一個供 Shadow DOM 使用的容器
  const shadowContainer = document.createElement('div');
  shadowContainer.id = 'form-root-shadow-container';
  container.appendChild(shadowContainer);

  // 在該容器上建立 Shadow DOM（open 模式）
  const shadowRoot = shadowContainer.attachShadow({ mode: 'open' });

  // 將 tailwindcss 與 formRoot css 合併
  const combinedStyles = `${tailwindcssOutput}\n${formRootCss}`;

  // 根據瀏覽器環境決定樣式注入方式
  if (navigator.userAgent.includes('Firefox')) {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = combinedStyles;
    shadowRoot.appendChild(styleElement);
  } else {
    const globalStyleSheet = new CSSStyleSheet();
    globalStyleSheet.replaceSync(combinedStyles);
    shadowRoot.adoptedStyleSheets = [globalStyleSheet];
  }

  // 建立 React 的容器，並附加到 Shadow DOM 中
  const rootIntoShadow = document.createElement('div');
  rootIntoShadow.id = 'shadow-form-root';
  shadowRoot.appendChild(rootIntoShadow);

  // 利用 createRoot 將 FormRoot 元件渲染進 Shadow DOM
  createRoot(rootIntoShadow).render(<FormRoot />);
} else {
  console.error('找不到 #form-root 容器');
}
