// // formRoot.tsx
import '@src/formRoot.css';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import type { HTMLReactParserOptions } from 'html-react-parser';
import parse, { Element } from 'html-react-parser';

interface PopupData {
  convertedHtml: string;
  initialData: Record<string, string>;
  title: string;
}

const FormRoot = () => {
  const [popupData, setPopupData] = useState<PopupData | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    // 向背景索取先前暫存的資料
    chrome.runtime.sendMessage({ action: 'getPopupData' }, (response: { data?: PopupData }) => {
      if (response?.data) {
        setPopupData(response.data);
        setFormData(response.data.initialData);
        // 設置 windows 頁面標題
        document.title = response.data.title || 'Default Title';
      } else {
        console.error('No popup data received.');
      }
    });
  }, []);

  if (!popupData) {
    return <div>Loading...</div>;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  // 這個函數用來根據原始 HTML 與 formData 產生最終輸出的文字
  const generateFinalText = (htmlString: string, formData: Record<string, string>): string => {
    // 建立一個臨時的容器
    const container = document.createElement('div');
    container.innerHTML = htmlString;
    console.log('Container:', container, 'container.innerHTML:', container.innerHTML);

    // 遍歷所有 input 節點
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
      const name = input.getAttribute('name');
      if (name) {
        const value = formData[name] || '';
        // 在替換文字前後加入空白，確保和其他文字不會直接連接
        const textNode = document.createTextNode(' ' + value + ' ');
        input.replaceWith(textNode);
      }
    });

    // 取得容器的文字內容，並利用正則把多餘的空白整理成單一空格，同時去除頭尾空白
    return container.textContent?.replace(/\s+/g, ' ').trim() || '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 使用 generateFinalText 產生最終的文字內容
    const finalOutput = generateFinalText(popupData.convertedHtml, formData);
    console.log('Final output:', finalOutput);
    chrome.runtime.sendMessage({ action: 'submitForm', finalOutput }, response => {
      console.log('Form submitted, response:', response);
      // 選擇性：提交後關閉 popup
      window.close();
    });
  };

  // 轉換 HTML 時將 <input> 元素替換成綁定了事件的 React 元素
  const options: HTMLReactParserOptions = {
    replace: domNode => {
      if (domNode instanceof Element && domNode.name === 'input') {
        const attribs = domNode.attribs;
        return (
          <input
            {...attribs}
            value={formData[attribs.name] || ''}
            onChange={handleInputChange}
            className="input-style"
          />
        );
      }
    },
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          maxHeight: '100vh',
          justifyContent: 'space-between',
        }}>
        {/* onSubmit={handleSubmit} */}
        <div style={{ overflowY: 'auto', height: '100%', padding: '1rem' }} className="m-4">
          <div className="flex">
            {/* 將解析後的內容渲染出來 */}
            {parse(popupData.convertedHtml, options)}
          </div>
        </div>
        {popupData.convertedHtml}
        <div className="bottom-controls">
          <div className="right-content">
            <button className="cancel-button">Cancel</button>
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
