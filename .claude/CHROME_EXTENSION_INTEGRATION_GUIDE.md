# Chrome Extension 與 PromptBear 新 JSON 格式整合指南

**文件版本**: 1.0  
**更新日期**: 2025-08-18  
**適用範圍**: PromptBear Chrome Extension  

---

## 📋 概述

PromptBear 已從不安全的 HTML 格式遷移至安全的 JSON 格式儲存，本指南將幫助 Chrome Extension 開發人員正確處理新的 JSON 格式，同時保持與舊 HTML 格式的向後相容性。

### 🎯 **核心目標**
- ✅ 支援新的 JSON 格式 (`contentJSON`)
- ✅ 保持向後相容性 (舊的 `content` HTML 格式)
- ✅ 確保表單彈窗功能正常運作
- ✅ 維持現有的使用者體驗

---

## 🔄 資料格式變更說明

### **新的 API 回應格式**
```typescript
interface PromptApiResponse {
  id: string;
  name: string;
  content: string;           // 舊格式 HTML (向後相容)
  contentJSON: object | null; // 新格式 JSON (主要格式)
  shortcut: string;
  seqNo: number;
}
```

### **處理優先順序**
1. **優先使用 `contentJSON`** (新格式，已經過安全處理)
2. **向後相容 `content`** (舊格式 HTML，需要額外清理)
3. **預設空白內容** (如果兩者都為空)

---

## 🔧 技術實作指南

### **第一步：安裝必要依賴**

在 Chrome Extension 專案中安裝以下套件：

```bash
npm install @tiptap/html @tiptap/starter-kit @tiptap/extension-text-style @tiptap/extension-text-align @tiptap/core dompurify
```

### **第二步：建立 TipTap 轉換器**

建立檔案 `src/utils/tiptapConverter.js`：

```javascript
import { generateHTML } from '@tiptap/html';
import { Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import DOMPurify from 'dompurify';

// FormText 自訂節點定義 (與後台保持一致)
const FormTextNode = Node.create({
  name: 'formtext',
  group: 'inline',
  inline: true,
  
  addAttributes() {
    return {
      promptData: { default: {} }
    };
  },
  
  parseHTML() {
    return [{ tag: 'span[data-type="formtext"]' }];
  },
  
  renderHTML({ node }) {
    const promptData = node.attrs.promptData || {};
    const displayText = `[${promptData.name || 'field'}:${promptData.default || ''}]`;
    
    return [
      'span',
      {
        'data-type': 'formtext',
        'data-prompt': JSON.stringify(promptData)
      },
      displayText
    ];
  }
});

// FormMenu 自訂節點定義
const FormMenuNode = Node.create({
  name: 'formmenu',
  group: 'inline',
  inline: true,
  
  addAttributes() {
    return {
      promptData: { default: {} }
    };
  },
  
  parseHTML() {
    return [{ tag: 'span[data-type="formmenu"]' }];
  },
  
  renderHTML({ node }) {
    const promptData = node.attrs.promptData || {};
    const defaultValue = Array.isArray(promptData.default) 
      ? promptData.default.join(', ') 
      : (promptData.default || '');
    const displayText = `[${promptData.name || 'menu'}:${defaultValue}]`;
    
    return [
      'span',
      {
        'data-type': 'formmenu',
        'data-prompt': JSON.stringify(promptData)
      },
      displayText
    ];
  }
});

// TipTap 擴展配置
const extensions = [
  StarterKit,
  TextStyle,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  FormTextNode,
  FormMenuNode
];

// DOMPurify 安全配置
const SAFE_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'div', 'span'],
  ALLOWED_ATTR: ['style', 'class', 'data-type', 'data-prompt'],
  ALLOW_DATA_ATTR: true,
  FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'button'],
  FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout', 'onfocus', 'onblur', 'onchange', 'onsubmit']
};

/**
 * 將 TipTap JSON 格式轉換為安全的 HTML
 * @param {Object} contentJSON - TipTap JSON 格式內容
 * @returns {string} 安全的 HTML 字串
 */
export function convertJSONToHTML(contentJSON) {
  if (!contentJSON) return '<p></p>';
  
  try {
    const html = generateHTML(contentJSON, extensions);
    return DOMPurify.sanitize(html, SAFE_CONFIG);
  } catch (error) {
    console.error('JSON to HTML conversion failed:', error);
    return '<p></p>';
  }
}

/**
 * 統一的內容處理函數
 * @param {Object} prompt - API 回應的 prompt 物件
 * @returns {string} 可顯示的 HTML 內容
 */
export function getDisplayableContent(prompt) {
  // 優先使用 JSON 格式
  if (prompt.contentJSON) {
    return convertJSONToHTML(prompt.contentJSON);
  }
  
  // 向後相容：使用 HTML 格式
  if (prompt.content) {
    return DOMPurify.sanitize(prompt.content, SAFE_CONFIG);
  }
  
  return '<p></p>';
}
```

### **第三步：更新表單元素檢測邏輯**

建立檔案 `src/utils/formElementDetector.js`：

```javascript
/**
 * 分析內容中的表單元素
 * @param {Object} prompt - Prompt 物件
 * @returns {Array} 表單元素陣列
 */
export function analyzeFormElements(prompt) {
  const html = getDisplayableContent(prompt);
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const formElements = [];
  const spans = doc.querySelectorAll('span[data-type]');
  
  spans.forEach((span, index) => {
    const type = span.getAttribute('data-type');
    const promptDataStr = span.getAttribute('data-prompt');
    
    if (type && promptDataStr) {
      try {
        const promptData = JSON.parse(promptDataStr);
        formElements.push({
          id: `form-element-${index}`,
          type: type,
          name: promptData.name || '',
          default: promptData.default || '',
          options: promptData.options || [],
          multiple: promptData.multiple || false,
          element: span,
          promptData: promptData
        });
      } catch (error) {
        console.warn('Failed to parse form element data:', error, promptDataStr);
      }
    }
  });
  
  return formElements;
}

/**
 * 檢查內容是否包含表單元素
 * @param {Object} prompt - Prompt 物件  
 * @returns {boolean} 是否包含表單元素
 */
export function hasFormElements(prompt) {
  const formElements = analyzeFormElements(prompt);
  return formElements.length > 0;
}
```

### **第四步：更新 Side Panel 邏輯**

修改現有的 `sidePanel.js`：

```javascript
import { getDisplayableContent, analyzeFormElements } from './utils/formElementDetector.js';

// 更新 renderPromptPreview 函數
function renderPromptPreview(prompt) {
  try {
    // 使用統一的內容處理
    const htmlContent = getDisplayableContent(prompt);
    const formElements = analyzeFormElements(prompt);
    
    // 顯示內容
    const previewContainer = document.getElementById('preview-container');
    if (previewContainer) {
      previewContainer.innerHTML = htmlContent;
      
      // 設置表單元素點擊監聽器
      formElements.forEach(formElement => {
        const spanElement = previewContainer.querySelector(`span[data-type="${formElement.type}"]`);
        if (spanElement) {
          spanElement.style.cursor = 'pointer';
          spanElement.style.backgroundColor = '#e3f2fd';
          spanElement.style.padding = '2px 4px';
          spanElement.style.borderRadius = '3px';
          
          spanElement.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showFormDialog(formElement);
          });
        }
      });
    }
    
    // 更新表單元素指示器
    updateFormElementsIndicator(formElements.length);
    
  } catch (error) {
    console.error('渲染 Prompt 預覽失敗:', error);
    showErrorMessage('無法載入 Prompt 內容');
  }
}

// 表單彈窗邏輯 (保持不變，因為 formElement 結構與之前一致)
function showFormDialog(formElement) {
  // 現有的彈窗邏輯可以直接使用
  // formElement 包含所有必要的屬性：type, name, default, options 等
  
  if (formElement.type === 'formtext') {
    showTextInputDialog(formElement);
  } else if (formElement.type === 'formmenu') {
    showMenuDialog(formElement);
  }
}

// 新增：表單元素指示器
function updateFormElementsIndicator(count) {
  const indicator = document.getElementById('form-elements-indicator');
  if (indicator) {
    indicator.textContent = count > 0 ? `包含 ${count} 個表單元素` : '無表單元素';
    indicator.className = count > 0 ? 'has-form-elements' : 'no-form-elements';
  }
}

// 新增：錯誤訊息顯示
function showErrorMessage(message) {
  const previewContainer = document.getElementById('preview-container');
  if (previewContainer) {
    previewContainer.innerHTML = `<div class="error-message">${message}</div>`;
  }
}
```

---

## 📊 資料格式範例

### **FormText JSON 格式**
```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph", 
      "content": [
        { "type": "text", "text": "歡迎 " },
        {
          "type": "formtext",
          "attrs": {
            "promptData": {
              "type": "formtext",
              "name": "userName",
              "default": "請輸入姓名",
              "cols": 20
            }
          }
        },
        { "type": "text", "text": "！" }
      ]
    }
  ]
}
```

**轉換後的 HTML**：
```html
<p>歡迎 <span data-type="formtext" data-prompt='{"type":"formtext","name":"userName","default":"請輸入姓名","cols":20}'>[userName:請輸入姓名]</span>！</p>
```

### **FormMenu JSON 格式**
```json
{
  "type": "formmenu",
  "attrs": {
    "promptData": {
      "type": "formmenu",
      "name": "userRole", 
      "options": ["管理員", "用戶", "訪客"],
      "multiple": false,
      "default": "用戶"
    }
  }
}
```

**轉換後的 HTML**：
```html
<span data-type="formmenu" data-prompt='{"type":"formmenu","name":"userRole","options":["管理員","用戶","訪客"],"multiple":false,"default":"用戶"}'>[userRole:用戶]</span>
```

---

## 🧪 測試與驗證

### **基本功能測試**

```javascript
// 測試用的 JSON 資料
const testPrompt = {
  id: 'test-123',
  name: '測試 Prompt',
  content: '', // 舊格式為空
  contentJSON: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '歡迎 ' },
          {
            type: 'formtext',
            attrs: {
              promptData: {
                name: 'userName',
                default: '請輸入姓名'
              }
            }
          }
        ]
      }
    ]
  },
  shortcut: '/test'
};

// 執行測試
function runBasicTests() {
  console.log('=== Chrome Extension 整合測試 ===');
  
  // 測試內容轉換
  const html = getDisplayableContent(testPrompt);
  console.log('轉換後的 HTML:', html);
  
  // 測試表單元素檢測
  const formElements = analyzeFormElements(testPrompt);
  console.log('檢測到的表單元素:', formElements);
  
  // 驗證 HTML 結構
  const hasCorrectStructure = html.includes('data-type="formtext"') && 
                             html.includes('data-prompt=');
  console.log('HTML 結構正確:', hasCorrectStructure);
  
  return {
    html,
    formElements,
    hasCorrectStructure
  };
}
```

### **向後相容性測試**

```javascript
// 測試舊格式 HTML
const legacyPrompt = {
  id: 'legacy-123',
  name: '舊格式 Prompt',
  content: '<p>歡迎 <span data-type="formtext" data-prompt=\'{"attributes":[{"name":"name","value":"userName"},{"name":"default","value":"請輸入姓名"}]}\'>userName</span>！</p>',
  contentJSON: null,
  shortcut: '/legacy'
};

function testBackwardCompatibility() {
  const html = getDisplayableContent(legacyPrompt);
  const formElements = analyzeFormElements(legacyPrompt);
  
  console.log('舊格式相容性測試:');
  console.log('- HTML 輸出:', html);
  console.log('- 表單元素:', formElements);
  console.log('- 能正常檢測表單:', formElements.length > 0);
}
```

---

## 🔧 故障排除指南

### **常見問題與解決方案**

#### **問題 1：表單元素無法檢測**
**症狀**：`analyzeFormElements()` 回傳空陣列  
**可能原因**：
- TipTap 轉換器缺少 FormTextNode/FormMenuNode 擴展
- JSON 格式不正確
- data-type 或 data-prompt 屬性遺失

**解決方案**：
```javascript
// 檢查轉換後的 HTML
const html = convertJSONToHTML(prompt.contentJSON);
console.log('轉換後的 HTML:', html);

// 檢查是否包含必要屬性
const hasDataType = html.includes('data-type=');
const hasDataPrompt = html.includes('data-prompt=');
console.log('包含 data-type:', hasDataType);
console.log('包含 data-prompt:', hasDataPrompt);
```

#### **問題 2：JSON 解析失敗**
**症狀**：`JSON.parse()` 拋出錯誤  
**解決方案**：
```javascript
function safeParsePromptData(promptDataStr) {
  try {
    return JSON.parse(promptDataStr);
  } catch (error) {
    console.warn('解析 promptData 失敗:', error, promptDataStr);
    return {};
  }
}
```

#### **問題 3：舊格式 HTML 無法正確處理**
**症狀**：舊格式的 data-prompt 結構不同  
**解決方案**：
```javascript
function parsePromptData(promptDataStr) {
  try {
    const parsed = JSON.parse(promptDataStr);
    
    // 檢查是否為舊格式 (有 attributes 陣列)
    if (parsed.attributes && Array.isArray(parsed.attributes)) {
      // 轉換舊格式到新格式
      const converted = {};
      parsed.attributes.forEach(attr => {
        converted[attr.name] = attr.value;
      });
      return converted;
    }
    
    // 新格式直接返回
    return parsed;
  } catch (error) {
    console.warn('解析 promptData 失敗:', error);
    return {};
  }
}
```

---

## 📈 效能考量

### **快取策略**
```javascript
// 實作轉換結果快取
const conversionCache = new Map();

export function getDisplayableContentCached(prompt) {
  const cacheKey = `${prompt.id}-${JSON.stringify(prompt.contentJSON || prompt.content)}`;
  
  if (conversionCache.has(cacheKey)) {
    return conversionCache.get(cacheKey);
  }
  
  const html = getDisplayableContent(prompt);
  conversionCache.set(cacheKey, html);
  
  // 限制快取大小
  if (conversionCache.size > 100) {
    const firstKey = conversionCache.keys().next().value;
    conversionCache.delete(firstKey);
  }
  
  return html;
}
```

### **效能監控**
```javascript
function measureConversionPerformance(prompt) {
  const startTime = performance.now();
  const html = getDisplayableContent(prompt);
  const endTime = performance.now();
  
  console.log(`轉換耗時: ${(endTime - startTime).toFixed(2)}ms`);
  
  return html;
}
```

---

## 🚀 部署檢查清單

### **部署前確認**
- [ ] 安裝所有必要的依賴套件
- [ ] FormTextNode 和 FormMenuNode 定義正確
- [ ] TipTap 擴展配置完整
- [ ] 轉換函數能正確處理新舊格式
- [ ] 表單檢測邏輯更新完成
- [ ] 彈窗功能測試通過
- [ ] 向後相容性測試通過

### **測試環境驗證**
```javascript
// 執行完整的整合測試
function runIntegrationTests() {
  const tests = [
    testJSONConversion,
    testFormElementDetection, 
    testBackwardCompatibility,
    testErrorHandling
  ];
  
  tests.forEach((test, index) => {
    try {
      const result = test();
      console.log(`測試 ${index + 1} 通過:`, result);
    } catch (error) {
      console.error(`測試 ${index + 1} 失敗:`, error);
    }
  });
}
```

---

## 📞 技術支援

如果在整合過程中遇到問題，請提供以下資訊：

1. **錯誤訊息**：完整的 console 錯誤訊息
2. **測試資料**：有問題的 prompt JSON 格式
3. **轉換結果**：`getDisplayableContent()` 的輸出
4. **Chrome 版本**：瀏覽器和 Extension 版本資訊

### **除錯工具**
```javascript
// 開啟詳細除錯模式
window.PROMPTBEAR_DEBUG = true;

// 使用除錯版本的轉換函數
export function getDisplayableContentDebug(prompt) {
  console.group('PromptBear Content Conversion Debug');
  console.log('Input prompt:', prompt);
  
  if (prompt.contentJSON) {
    console.log('Using JSON format');
    const html = convertJSONToHTML(prompt.contentJSON);
    console.log('Converted HTML:', html);
  } else if (prompt.content) {
    console.log('Using HTML format (backward compatibility)');
    const html = DOMPurify.sanitize(prompt.content, SAFE_CONFIG);
    console.log('Sanitized HTML:', html);
  }
  
  console.groupEnd();
  return getDisplayableContent(prompt);
}
```

---

**文件撰寫者**: PromptBear 開發團隊  
**技術審查**: 需要 Chrome Extension 團隊確認  
**最後更新**: 2025-08-18

---

> 💡 **重要提醒**: 這個整合指南基於 PromptBear 最新的安全性升級，確保在實作前先在測試環境中驗證所有功能。如有任何問題，請及時回饋給開發團隊。