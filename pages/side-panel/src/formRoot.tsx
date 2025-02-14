// // formRoot.tsx
// import React, { useEffect, useState } from 'react';
// import { createRoot } from 'react-dom/client';

// interface PopupData {
//   convertedHtml: string;
//   initialData: Record<string, string>;
// }

// const FormApp: React.FC = () => {
//   const [popupData, setPopupData] = useState<PopupData | null>(null);
//   const [formData, setFormData] = useState<Record<string, string>>({});

//   useEffect(() => {
//     // 向背景索取先前暫存的資料
//     chrome.runtime.sendMessage({ action: 'getPopupData' }, (response: { data?: PopupData }) => {
//       if (response?.data) {
//         setPopupData(response.data);
//         setFormData(response.data.initialData);
//       } else {
//         console.error('No popup data received.');
//       }
//     });
//   }, []);

//   if (!popupData) {
//     return <div>Loading...</div>;
//   }

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     // 提交表單資料給背景，由背景處理後續（例如插入到當前頁面）
//     chrome.runtime.sendMessage({ action: 'submitForm', formData }, response => {
//       console.log('Form submitted, response:', response);
//       // 選擇性：提交後關閉 popup
//       window.close();
//     });
//   };

//   return (
//     <div style={{ padding: '20px' }}>
//       <h1>Fill in the Form</h1>
//       <form onSubmit={handleSubmit}>
//         {Object.keys(formData).map(key => (
//           <div key={key} style={{ marginBottom: '10px' }}>
//             <label htmlFor={key} style={{ marginRight: '10px' }}>{key}</label>
//             <input
//               id={key}
//               type="text"
//               name={key}
//               value={formData[key]}
//               placeholder={key}
//               onChange={handleInputChange}
//               style={{ padding: '5px' }}
//             />
//           </div>
//         ))}
//         <button type="submit" style={{ padding: '8px 16px' }}>Insert</button>
//       </form>
//       <div style={{ marginTop: '20px' }}>
//         <h2>Preview (Converted HTML)</h2>
//         <div dangerouslySetInnerHTML={{ __html: popupData.convertedHtml }} />
//       </div>
//     </div>
//   );
// };

// const container = document.getElementById('root');
// if (container) {
//   const root = createRoot(container);
//   root.render(<FormApp />);
// }

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import type { HTMLReactParserOptions } from 'html-react-parser';
import parse, { Element } from 'html-react-parser';

interface PopupData {
  convertedHtml: string;
  initialData: Record<string, string>;
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
    // 遍歷所有 input 節點
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
      const name = input.getAttribute('name');
      if (name) {
        const value = formData[name] || '';
        // 建立一個文字節點
        const textNode = document.createTextNode(value);
        // 將 input 替換成文字節點
        input.replaceWith(textNode);
      }
    });
    // 回傳整個容器的文字內容
    return container.textContent || '';
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
        return <input {...attribs} value={formData[attribs.name] || ''} onChange={handleInputChange} />;
      }
    },
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Fill in the Form</h1>
      <form onSubmit={handleSubmit}>
        {/* 將解析後的內容渲染出來 */}
        {parse(popupData.convertedHtml, options)}

        <button type="submit" style={{ padding: '8px 16px' }}>
          Insert
        </button>
      </form>
      {popupData.convertedHtml}
    </div>
  );
};

const container = document.getElementById('form-root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<FormRoot />);
} else {
  console.error('找不到 #form-root 容器');
}
