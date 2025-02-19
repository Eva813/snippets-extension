import '@src/SidePanel.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { useState } from 'react';
import { FaCaretDown, FaCaretRight, FaArrowAltCircleDown } from 'react-icons/fa';
import Header from './components/Header';

const SidePanel = () => {
  const goToDashboard = () => chrome.tabs.create({ url: 'https://chatgpt.com/' });
  //const [activeFolderMenu, setActiveFolderMenu] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [hoveredSnippetId, setHoveredSnippetId] = useState<string | null>(null);
  // 新增動畫觸發的 snippet id 狀態
  const [activeAnimationId, setActiveAnimationId] = useState<string | null>(null);

  const toggleCollapse = (folderId: string) => {
    const newCollapsed = new Set(collapsedFolders);
    if (newCollapsed.has(folderId)) {
      newCollapsed.delete(folderId);
    } else {
      newCollapsed.add(folderId);
    }
    setCollapsedFolders(newCollapsed);
  };
  const folders = [
    {
      id: 'HplOMyf2mDqvVMdphJbt',
      name: 'My Sample Snippets',
      description: '<p>This is a sample folder</p>',
      snippets: [
        {
          id: '5mJw031VPo2WxNIQyeXN',
          name: 'Demo - Plain text',
          content: '<p>be a software engineer</p>',
          shortcut: '/do',
        },
        {
          id: '6mJw031VPo2WxNIQyeYN',
          name: 'Demo - Styled Text',
          content:
            '<p>be a translate expert, I will give you a sentence and help me translate to english<span data-type="formtext" class="form-text-field" contenteditable="false" role="button" label="www" defaultvalue="">name: www</span></p><p><span data-type="formtext" class="form-text-field" contenteditable="false" role="button" label="lan" defaultvalue="en">name: lan, default: en</span></p>',
          shortcut: '/ih',
        },
        {
          id: 'snippet-1736573580906',
          name: 'HHHH',
          content:
            '<p>New snippet contentHHHHH, 3扮演前端工程師，專業於<span data-type="formtext" class="form-text-field" contenteditable="false" role="button" label="front" defaultvalue="">name: front</span>，具有語言能力<span data-type="formtext" class="form-text-field" contenteditable="false" role="button" label="lang" defaultvalue="">name: lang</span></p>',
          shortcut: '/pro',
        },
        {
          id: 'snippet-1736574349364',
          name: 'EEE',
          content:
            '<p>MMMYM<span data-type="formtext" class="form-text-field" contenteditable="false" role="button" label="peter" defaultvalue="">name: peter</span></p>',
          shortcut: '/add',
        },
        {
          id: 'snippet-1736657362715',
          name: 'New snippet',
          content: 'New snippet content',
          shortcut: '/dott',
        },
        {
          id: 'snippet-1736658054583',
          name: 'New snippet',
          content: 'New snippet content',
          shortcut: '/er',
        },
      ],
    },
    {
      id: 'folder-1736949636952',
      name: 'New folder',
      description: '',
      snippets: [],
    },
  ];

  const insertPrompt = (id: string) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs || !tabs[0].id) {
        console.warn('No active tab found.');
        return;
      }
      const snippet = folders.flatMap(folder => folder.snippets).find(snippet => snippet.id === id);
      if (snippet) {
        // 檢查 snippet.content 是否包含 'data-type="formtext"'
        const hasFormField = snippet.content.includes('data-type="formtext"');
        const title = `${snippet.shortcut} - ${snippet.name}`; // 組合標題
        if (!hasFormField) {
          // 沒有表單欄位，直接發送訊息給 content script進行插入
          chrome.tabs.sendMessage(tabs[0].id, { action: 'insertPrompt', prompt: snippet.content, title }, response => {
            console.log('first Side panel,  Insertion response:', response);
            setActiveAnimationId(id);
          });
        } else {
          // 有表單欄位，傳送訊息給 background，由 background 負責打開 popup
          // chrome.runtime.sendMessage({ action: 'createWindow', prompt: snippet.content }, response => {
          //   console.log('Window creation response:', response);
          // });
          // 有表單欄位，先轉換模板
          const { convertedHtml, initialData } = convertTemplate(snippet.content);
          // 發送訊息給 background，讓它暫存轉換後的資料，並建立 popup
          chrome.runtime.sendMessage({ action: 'createWindow', convertedHtml, initialData, title }, response => {
            console.log('Window creation response:', response);
          });
        }
      } else {
        console.warn('Snippet not found.');
      }
    });
  };

  // 接收取得 snippetByShortcut
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 新增除錯日誌
    console.log('收到訊息:', message);
    console.log('current folders:', folders);
    if (message.action === 'getSnippetByShortcut') {
      console.log('shortcuts 觸發:', message.shortcut);
      const snippet = folders.flatMap(folder => folder.snippets).find(snippet => snippet.shortcut === message.shortcut);
      console.log('找到的 snippet:', snippet);
      sendResponse({ snippet });
    }
  });

  return (
    <div className="flex h-[500px]">
      {/* Header */}
      <Header goToDashboard={goToDashboard} />
      {/* snippets List*/}
      <div className="size-full overflow-y-auto bg-white p-2 pt-[70px]">
        <h2 className="mb-2 text-lg font-semibold">Snippets</h2>
        <ul className="dark:text-gray-200">
          {folders.map(folder => (
            <li key={folder.id} className="mb-2">
              <button
                className={`flex w-full items-center justify-between rounded px-2 py-1 hover:bg-gray-100 dark:hover:text-black 
                  `}>
                <strong className="cursor-pointer text-lg">{folder.name}</strong>
                <div className="flex items-center">
                  <button
                    onClick={() => toggleCollapse(folder.id)}
                    className="mr-1 rounded p-1 hover:bg-gray-200 focus:outline-none dark:hover:bg-gray-800">
                    {collapsedFolders.has(folder.id) ? (
                      <FaCaretRight className="text-gray-400" size={16} />
                    ) : (
                      <FaCaretDown className="text-gray-400" size={16} />
                    )}
                  </button>
                </div>
              </button>
              {!collapsedFolders.has(folder.id) && (
                <ul className="ml-4 mt-1">
                  {folder.snippets.length === 0 ? (
                    <span className="ml-2 text-gray-500">No snippets in the folder</span>
                  ) : (
                    folder.snippets.map(snippet => (
                      <li
                        key={snippet.id}
                        className="mb-2"
                        onMouseEnter={() => setHoveredSnippetId(snippet.id)}
                        onMouseLeave={() => setHoveredSnippetId(null)}>
                        <div
                          className={`flex w-full items-center justify-between rounded px-2 py-1 hover:bg-gray-100 dark:hover:text-black`}>
                          <span className="flex items-center">{snippet.name}</span>
                          {/* Button: 只有 hover 時顯示，並使用 invisible 保持對齊 */}
                          <div className="relative ml-4 mr-auto inline-block">
                            <button
                              className={`transition-opacity duration-200 ${
                                hoveredSnippetId === snippet.id ? 'visible opacity-100' : 'invisible opacity-0'
                              }`}
                              onClick={() => insertPrompt(snippet.id)}>
                              <FaArrowAltCircleDown className="mr-1 inline-block text-slate-700" size={20} />
                            </button>
                            {activeAnimationId === snippet.id && (
                              <div
                                className="firework-animation absolute inset-0 flex items-center justify-center"
                                onAnimationEnd={() => setActiveAnimationId(null)}>
                                <span className="sparkle">✨</span>
                              </div>
                            )}
                          </div>
                          <span className="inline-flex h-6 items-center rounded-full border border-blue-300 px-3 py-1 text-sm  font-medium">
                            {snippet.shortcut}
                          </span>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// SidePanel.tsx 內的模板轉換方法
const convertTemplate = (template: string): { convertedHtml: string; initialData: Record<string, string> } => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(template, 'text/html');
  const initialData: Record<string, string> = {};
  // 找到所有帶有 data-type="formtext" 的元素
  const fields = doc.querySelectorAll('[data-type="formtext"]');
  fields.forEach((elem, index) => {
    // 使用 label 屬性作為欄位 key，如果沒有，則用 index 補充
    const key = elem.getAttribute('label') || `field_${index}`;
    const defaultValue = elem.getAttribute('defaultvalue') || '';
    initialData[key] = defaultValue;
    // 建立 input 元件
    const input = doc.createElement('input');
    input.type = 'text';
    // 用 label 屬性作為 placeholder
    input.placeholder = key;
    input.value = defaultValue;
    input.name = key;
    // 可加入 onChange 事件，但這邊我們會在 popup 裡統一綁定
    // 將原先的 span 替換掉
    elem.parentNode?.replaceChild(input, elem);
  });
  console.log(' doc.body.innerHTML data:', doc.body.innerHTML);
  // 回傳轉換後的 innerHTML 與初始資料
  return { convertedHtml: doc.body.innerHTML, initialData };
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
