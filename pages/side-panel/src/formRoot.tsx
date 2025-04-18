// // formRoot.tsx
import '@src/formRoot.css';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
// import type { HTMLReactParserOptions } from 'html-react-parser';
// import parse, { Element } from 'html-react-parser';
import { renderCustomElement } from '@src/components/renderers/renderCustomElement';
import { parseHtml } from '@src/lib/utils';
interface PopupData {
  title: string;
  content: string;
}

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

const FormRoot = () => {
  const [popupData, setPopupData] = useState<PopupData | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPopupData = async () => {
      chrome.runtime.sendMessage({ action: 'getPopupData' }, (response: { data?: PopupData }) => {
        if (response?.data) {
          setPopupData(response.data);
          document.title = response.data.title || 'Default Title';
        } else {
          console.error('未收到 popup 資料');
        }
      });
    };

    fetchPopupData();
  }, []);

  const initFormData = useCallback((id: string, value: string) => {
    setFormData(prev => {
      if (prev[id]) return prev;
      return { ...prev, [id]: value };
    });
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  }, []);

  // 遞迴渲染 DOM ➝ React 元素
  const renderNode = useCallback(
    (node: ChildNode, key: string): React.ReactNode => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();

        // 特殊自訂元件
        if (el.tagName === 'SPAN' && el.hasAttribute('data-type')) {
          return renderCustomElement(el, key, handleInputChange, initFormData);
        }

        // 遞迴子節點
        const children = Array.from(el.childNodes).map((child, i) => renderNode(child, `${key}-${i}`));

        // void tag，不含 children
        if (VOID_TAGS.has(tagName)) {
          return React.createElement(tagName, { key });
        }

        // 建立 style object，加入樣式
        const styleObj: React.CSSProperties = {};
        const style = el.style;
        for (let i = 0; i < style.length; i++) {
          const prop = style.item(i);
          if (!prop) continue;
          const camelProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) as keyof React.CSSProperties;
          const value = style.getPropertyValue(prop);
          if (value) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            styleObj[camelProp] = value as any;
          }
        }

        return React.createElement(
          tagName,
          {
            key,
            className: 'my-1',
            style: styleObj,
          },
          children,
        );
      }

      return null;
    },
    [handleInputChange, initFormData],
  );

  // 利用 useMemo 僅在 popupData 改變時解析 HTML 樹
  const parsedHtmlTree = useMemo(() => {
    if (!popupData) return null;

    const root = parseHtml(popupData.content);
    if (!root) return null;
    return Array.from(root.childNodes).map((child, i) => renderNode(child, `root-${i}`));
  }, [popupData, renderNode]);

  if (!popupData) {
    return <div>Loading...</div>;
  }

  // 這個函數用來根據 react preview 與 formData 產生最終輸出的文字
  const generateFinalText = (reactNode: React.ReactNode, formData: Record<string, string>): string => {
    const renderNodeToText = (node: React.ReactNode): string => {
      if (typeof node === 'string') return node;

      if (!React.isValidElement(node)) return '';

      const { type, props } = node;

      // 處理 <input> 和 <select>：轉成對應的表單資料值
      if (type === 'input' || type === 'select') {
        const value = formData[props.id] ?? '';
        return ` ${value} `;
      }

      // 處理 <p>：保留段落格式
      if (type === 'p') {
        const content = React.Children.map(props.children, renderNodeToText)?.join('') ?? '';
        return `<p>${content}</p>`;
      }

      // 處理其他元素：遞迴處理子元素
      const children = React.Children.map(props.children, renderNodeToText)?.join('') ?? '';
      return children;
    };

    // 處理陣列或單一節點
    if (Array.isArray(reactNode)) {
      return reactNode.map(node => renderNodeToText(node)).join('\n'); // 使用換行符號分隔段落
    }

    return renderNodeToText(reactNode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 使用 generateFinalText 產生最終的文字內容
    const finalOutput = generateFinalText(parsedHtmlTree, formData);
    chrome.runtime.sendMessage({ action: 'submitForm', finalOutput }, () => {
      window.close();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleCancel = () => {
    window.close();
  };

  return (
    <>
      <div className="form-root-container" onKeyDown={handleKeyDown} role="presentation" aria-label="表單區域">
        <div style={{ overflowY: 'auto', height: '100%', padding: '1rem' }}>
          {/* 預覽區塊 */}
          <div className="flex-1 overflow-y-auto">{parsedHtmlTree}</div>
        </div>
        {/* 顯示表單資料的偵錯資訊 */}
        {/* <div>{JSON.stringify(formData)}</div> */}
        <div className="bottom-controls">
          <div className="right-content">
            <button className="cancel-button" onClick={handleCancel}>
              Cancel
            </button>
            <button className="insert-button" onClick={handleSubmit}>
              Insert
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const container = document.getElementById('form-root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<FormRoot />);
} else {
  console.error('找不到 #form-root 容器');
}
