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
    // 向背景索取先前暫存的資料
    chrome.runtime.sendMessage({ action: 'getPopupData' }, (response: { data?: PopupData }) => {
      if (response?.data) {
        setPopupData(response.data);
        // 設置 windows 頁面標題
        document.title = response.data.title || 'Default Title';
      } else {
        console.error('No popup data received.');
      }
    });
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Input changed:', e.target);
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

        if (el.tagName === 'SPAN' && el.hasAttribute('data-type')) {
          // 增加一個初始化表單值的回調函式
          const initFormData = (id: string, value: string) => {
            setFormData(prev => {
              // 如果該 id 已經有值，就不覆蓋
              if (prev[id]) return prev;
              return { ...prev, [id]: value };
            });
          };
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
    [handleInputChange],
  );

  // 利用 useMemo 僅在 popupData 改變時解析 HTML 樹
  const parsedHtmlTree = useMemo(() => {
    if (!popupData) return null;
    console.log('popupData:', popupData);
    const root = parseHtml(popupData.content);
    if (!root) return null;
    return Array.from(root.childNodes).map((child, i) => renderNode(child, `root-${i}`));
  }, [popupData, renderNode]);

  if (!popupData) {
    return <div>Loading...</div>;
  }

  // 這個函數用來根據 react preview 與 formData 產生最終輸出的文字
  const generateFinalText = (reactNode: React.ReactNode, formData: Record<string, string>): string => {
    const processNode = (node: React.ReactNode): string | string[] => {
      console.log('Processing node:', node);
      if (React.isValidElement(node)) {
        // 如果是 <input> 元素，替換為文字節點
        if (node.type === 'input') {
          const id = node.props.id;
          const value = formData[id] || '';
          return ` ${value} `; // 返回 input 的值
        }

        // 如果是 <p> 元素，保留分段
        if (node.type === 'p') {
          const children = React.Children.map(node.props.children, processNode) || [];
          return `<p>${children.join('')}</p>`; // 用 <br/> 分隔段落
        }

        // 遞迴處理其他元素的子節點
        // 處理其他元素：如果有子節點，直接處理
        const children = React.Children.map(node.props.children, processNode) || [];
        return children.join('');
      }

      // 如果是文字節點，直接返回內容
      if (typeof node === 'string') {
        return node;
      }

      // 如果是其他類型，返回空字串
      return '';
    };

    // 如果輸入是陣列，處理每個元素，並保留分段
    if (Array.isArray(reactNode)) {
      return (
        reactNode
          .map(node => {
            const result = processNode(node);
            return Array.isArray(result) ? result.join('') : result;
          })
          // .filter(Boolean) // 過濾掉空段落
          .join('\n')
      ); // 用換行符號分隔段落
    }

    const result = processNode(reactNode);
    return Array.isArray(result) ? result.join('') : result;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 使用 generateFinalText 產生最終的文字內容
    const finalOutput = generateFinalText(parsedHtmlTree, formData);
    console.log('Final output:', finalOutput);
    chrome.runtime.sendMessage({ action: 'submitForm', finalOutput }, response => {
      console.log('Form submitted, response:', response);
      // 選擇性：提交後關閉 popup
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
        <div style={{ overflowY: 'auto', height: '100%', padding: '1rem' }} className="m-4">
          {/* 預覽區塊 */}
          <div className="mt-4 flex-1 overflow-y-auto border-2 border-dashed p-4">{parsedHtmlTree}</div>
        </div>
        {JSON.stringify(formData)}
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
