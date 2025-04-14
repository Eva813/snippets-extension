// import '@src/SidePanel.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { useState, useEffect, useMemo, useRef } from 'react';
import { FaCaretDown, FaCaretRight, FaArrowAltCircleDown } from 'react-icons/fa';
import Header from './components/Header';

interface SidePanelProps extends Record<string, unknown> {
  alignment: 'left' | 'right';
  visible: boolean;
  isInDOM: boolean;
  isAnimating: boolean;
  noAnimation: boolean;
  setIsInDOM: (value: boolean) => void;
  toggleAlignment: () => void;
  onHover: (element: HTMLElement | null) => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ alignment, isInDOM, isAnimating, noAnimation, setIsInDOM, onHover }) => {
  const goToDashboard = () => chrome.tabs.create({ url: 'https://linxly-nextjs.vercel.app/' });
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [hoveredSnippetId, setHoveredSnippetId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggleCollapse = (folderId: string) => {
    const newCollapsed = new Set(collapsedFolders);
    if (newCollapsed.has(folderId)) {
      newCollapsed.delete(folderId);
    } else {
      newCollapsed.add(folderId);
    }
    setCollapsedFolders(newCollapsed);
  };
  const folders = useMemo(
    () => [
      {
        id: 'HplOMyf2mDqvVMdphJbt',
        name: 'My Sample Snippets',
        description: 'This is a sample folder',
        snippets: [
          {
            id: '5mJw031VPo2WxNIQyeXN',
            name: 'Demo - Plain text',
            content:
              '<p>be a software engineer, familliar with</p><p><span data-type="formtext" data-snippet="{&quot;type&quot;:&quot;formtext&quot;,&quot;spec&quot;:{&quot;positional&quot;:[0,0],&quot;named&quot;:{&quot;name&quot;:{&quot;priority&quot;:2,&quot;description&quot;:&quot;Name of the form field&quot;,&quot;placeholder&quot;:&quot;Label&quot;,&quot;type&quot;:&quot;string&quot;,&quot;static&quot;:true},&quot;default&quot;:{&quot;type&quot;:&quot;string&quot;,&quot;constant&quot;:true,&quot;priority&quot;:2,&quot;placeholder&quot;:&quot;Placeholder&quot;,&quot;description&quot;:&quot;The default value for the field&quot;}}},&quot;commandName&quot;:&quot;formtext&quot;,&quot;addon_id&quot;:null,&quot;icon_url&quot;:null,&quot;hasMatchingTokens&quot;:false,&quot;attributes&quot;:[{&quot;name&quot;:&quot;name&quot;,&quot;value&quot;:&quot;frontEnd&quot;},{&quot;name&quot;:&quot;default&quot;,&quot;value&quot;:&quot;vue&quot;}]}"></span></p><p><span data-type="formtext" data-snippet="{&quot;type&quot;:&quot;formtext&quot;,&quot;spec&quot;:{&quot;positional&quot;:[0,0],&quot;named&quot;:{&quot;name&quot;:{&quot;priority&quot;:2,&quot;description&quot;:&quot;Name of the form field&quot;,&quot;placeholder&quot;:&quot;Label&quot;,&quot;type&quot;:&quot;string&quot;,&quot;static&quot;:true},&quot;default&quot;:{&quot;type&quot;:&quot;string&quot;,&quot;constant&quot;:true,&quot;priority&quot;:2,&quot;placeholder&quot;:&quot;Placeholder&quot;,&quot;description&quot;:&quot;The default value for the field&quot;}}},&quot;commandName&quot;:&quot;formtext&quot;,&quot;addon_id&quot;:null,&quot;icon_url&quot;:null,&quot;hasMatchingTokens&quot;:false,&quot;attributes&quot;:[{&quot;name&quot;:&quot;name&quot;,&quot;value&quot;:&quot;&quot;},{&quot;name&quot;:&quot;default&quot;,&quot;value&quot;:&quot;english&quot;}]}"></span></p><p></p><p></p>',
            shortcut: '/do',
          },
          {
            id: '9mJw031VPo2WxNIQyeRT',
            name: 'Demo - Plain text-2',
            content:
              '<p>be a software engineer, familliar with</p><p><span data-type="formtext" data-snippet="{&quot;type&quot;:&quot;formtext&quot;,&quot;spec&quot;:{&quot;positional&quot;:[0,0],&quot;named&quot;:{&quot;name&quot;:{&quot;priority&quot;:2,&quot;description&quot;:&quot;Name of the form field&quot;,&quot;placeholder&quot;:&quot;Label&quot;,&quot;type&quot;:&quot;string&quot;,&quot;static&quot;:true},&quot;default&quot;:{&quot;type&quot;:&quot;string&quot;,&quot;constant&quot;:true,&quot;priority&quot;:2,&quot;placeholder&quot;:&quot;Placeholder&quot;,&quot;description&quot;:&quot;The default value for the field&quot;}}},&quot;commandName&quot;:&quot;formtext&quot;,&quot;addon_id&quot;:null,&quot;icon_url&quot;:null,&quot;hasMatchingTokens&quot;:false,&quot;attributes&quot;:[{&quot;name&quot;:&quot;name&quot;,&quot;value&quot;:null},{&quot;name&quot;:&quot;default&quot;,&quot;value&quot;:&quot;vue&quot;}]}"></span></p><p><span data-type="formtext" data-snippet="{&quot;type&quot;:&quot;formtext&quot;,&quot;spec&quot;:{&quot;positional&quot;:[0,0],&quot;named&quot;:{&quot;name&quot;:{&quot;priority&quot;:2,&quot;description&quot;:&quot;Name of the form field&quot;,&quot;placeholder&quot;:&quot;Label&quot;,&quot;type&quot;:&quot;string&quot;,&quot;static&quot;:true},&quot;default&quot;:{&quot;type&quot;:&quot;string&quot;,&quot;constant&quot;:true,&quot;priority&quot;:2,&quot;placeholder&quot;:&quot;Placeholder&quot;,&quot;description&quot;:&quot;The default value for the field&quot;}}},&quot;commandName&quot;:&quot;formtext&quot;,&quot;addon_id&quot;:null,&quot;icon_url&quot;:null,&quot;hasMatchingTokens&quot;:false,&quot;attributes&quot;:[{&quot;name&quot;:&quot;name&quot;,&quot;value&quot;:&quot;same&quot;},{&quot;name&quot;:&quot;default&quot;,&quot;value&quot;:&quot;english&quot;}]}"></span></p><p><span data-type="formtext" data-snippet="{&quot;type&quot;:&quot;formtext&quot;,&quot;spec&quot;:{&quot;positional&quot;:[0,0],&quot;named&quot;:{&quot;name&quot;:{&quot;priority&quot;:2,&quot;description&quot;:&quot;Name of the form field&quot;,&quot;placeholder&quot;:&quot;Label&quot;,&quot;type&quot;:&quot;string&quot;,&quot;static&quot;:true},&quot;default&quot;:{&quot;type&quot;:&quot;string&quot;,&quot;constant&quot;:true,&quot;priority&quot;:2,&quot;placeholder&quot;:&quot;Placeholder&quot;,&quot;description&quot;:&quot;The default value for the field&quot;}}},&quot;commandName&quot;:&quot;formtext&quot;,&quot;addon_id&quot;:null,&quot;icon_url&quot;:null,&quot;hasMatchingTokens&quot;:false,&quot;attributes&quot;:[{&quot;name&quot;:&quot;name&quot;,&quot;value&quot;:&quot;same&quot;},{&quot;name&quot;:&quot;default&quot;,&quot;value&quot;:&quot;testNoName&quot;}]}"></span></p><p></p><p></p>',
            shortcut: '/2do',
          },
          {
            id: '6mJw031VPo2WxNIQyeYN',
            name: 'Demo - Styled Text',
            content: '<p>be a translate expert, I will give you a sentence and help me translate to english</p>',
            shortcut: '/ih',
          },
          {
            name: 'New bb',
            content:
              '<p>test</p><p><span data-type="formmenu" data-snippet="{&quot;type&quot;:&quot;formmenu&quot;,&quot;spec&quot;:{&quot;positional&quot;:[0,0],&quot;named&quot;:{&quot;options&quot;:{&quot;type&quot;:&quot;string&quot;,&quot;list&quot;:&quot;positional&quot;,&quot;priority&quot;:-1,&quot;placeholder&quot;:&quot;Placeholder&quot;,&quot;description&quot;:&quot;The menu options&quot;},&quot;name&quot;:{&quot;priority&quot;:2,&quot;description&quot;:&quot;Name of the form field&quot;,&quot;placeholder&quot;:&quot;Label&quot;,&quot;type&quot;:&quot;string&quot;,&quot;static&quot;:true},&quot;default&quot;:{&quot;type&quot;:&quot;string&quot;,&quot;constant&quot;:true,&quot;priority&quot;:2,&quot;placeholder&quot;:&quot;Placeholder&quot;,&quot;description&quot;:&quot;The default value for the field&quot;},&quot;multiple&quot;:{&quot;type&quot;:&quot;boolean&quot;,&quot;constant&quot;:true,&quot;priority&quot;:1.4,&quot;placeholder&quot;:&quot;yes&quot;,&quot;description&quot;:&quot;Whether the user can select multiple items&quot;}}},&quot;commandName&quot;:&quot;formmenu&quot;,&quot;addon_id&quot;:null,&quot;icon_url&quot;:null,&quot;hasMatchingTokens&quot;:false,&quot;attributes&quot;:[{&quot;name&quot;:&quot;options&quot;,&quot;value&quot;:[&quot;Choice 1&quot;,&quot;Choice 2&quot;,&quot;test&quot;]},{&quot;name&quot;:&quot;name&quot;,&quot;value&quot;:&quot;testOption&quot;},{&quot;name&quot;:&quot;default&quot;,&quot;value&quot;:&quot;Choice 2&quot;},{&quot;name&quot;:&quot;multiple&quot;,&quot;value&quot;:false}]}"></span></p><p><span data-type="formmenu" data-snippet="{&quot;type&quot;:&quot;formmenu&quot;,&quot;spec&quot;:{&quot;positional&quot;:[0,0],&quot;named&quot;:{&quot;options&quot;:{&quot;type&quot;:&quot;string&quot;,&quot;list&quot;:&quot;positional&quot;,&quot;priority&quot;:-1,&quot;placeholder&quot;:&quot;Placeholder&quot;,&quot;description&quot;:&quot;The menu options&quot;},&quot;name&quot;:{&quot;priority&quot;:2,&quot;description&quot;:&quot;Name of the form field&quot;,&quot;placeholder&quot;:&quot;Label&quot;,&quot;type&quot;:&quot;string&quot;,&quot;static&quot;:true},&quot;default&quot;:{&quot;type&quot;:&quot;string&quot;,&quot;constant&quot;:true,&quot;priority&quot;:2,&quot;placeholder&quot;:&quot;Placeholder&quot;,&quot;description&quot;:&quot;The default value for the field&quot;},&quot;multiple&quot;:{&quot;type&quot;:&quot;boolean&quot;,&quot;constant&quot;:true,&quot;priority&quot;:1.4,&quot;placeholder&quot;:&quot;yes&quot;,&quot;description&quot;:&quot;Whether the user can select multiple items&quot;}}},&quot;commandName&quot;:&quot;formmenu&quot;,&quot;addon_id&quot;:null,&quot;icon_url&quot;:null,&quot;hasMatchingTokens&quot;:false,&quot;attributes&quot;:[{&quot;name&quot;:&quot;options&quot;,&quot;value&quot;:[&quot;mul&quot;,&quot;tttt&quot;,&quot;Choice 3&quot;]},{&quot;name&quot;:&quot;name&quot;,&quot;value&quot;:&quot;&quot;},{&quot;name&quot;:&quot;default&quot;,&quot;value&quot;:[&quot;Choice 3&quot;,&quot;tttt&quot;]},{&quot;name&quot;:&quot;multiple&quot;,&quot;value&quot;:true}]}"></span></p>',
            shortcut: '/bt',
            id: 'snippet-1744093758762',
          },
        ],
      },
      {
        id: 'folder-1741057188488',
        name: 'Test',
        description: 'test',
        snippets: [
          {
            id: 'snippet-1741057206823',
            name: 'test',
            content: '<p>New snippet content Test</p>',
            shortcut: '/test',
          },
        ],
      },
    ],
    [],
  );
  // 將 snippet 存到 storage
  useEffect(() => {
    const snippetsMap = folders.reduce<Record<string, (typeof folders)[0]['snippets'][0]>>((acc, folder) => {
      folder.snippets.forEach(snippet => {
        acc[snippet.shortcut] = snippet;
      });
      return acc;
    }, {});

    chrome.storage.local.set({ snippets: snippetsMap }, () => {
      console.log('Snippets saved to storage:', snippetsMap);
    });
  }, [folders]);

  const insertPrompt = (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    console.log('insertPrompt id:', id);

    const snippet = folders.flatMap(folder => folder.snippets).find(snippet => snippet.id === id);
    if (!snippet) {
      console.warn('Snippet not found.');
      return;
    }

    // 檢查 snippet.content 是否包含 'data-snippet'
    const hasFormField = snippet.content.includes('data-snippet');
    const title = `${snippet.shortcut} - ${snippet.name}`;

    if (!hasFormField) {
      // 沒有表單欄位，改由傳送訊息給背景，由背景呼叫 chrome.tabs.query
      chrome.runtime.sendMessage(
        {
          action: 'sidePanelInsertPrompt',
          snippet: {
            content: snippet.content,
            shortcut: snippet.shortcut,
            name: snippet.name,
          },
        },
        response => {
          console.log('Insertion response from background:', response);
          // setActiveAnimationId(id);
        },
      );
    } else {
      // 有表單欄位，仍透過背景建立 popup
      const content = snippet.content;
      chrome.runtime.sendMessage({ action: 'createWindow', title, content }, response => {
        console.log('Window creation response:', response);
      });
    }
  };

  // 接收取得 snippetByShortcut
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 新增除錯日誌
    console.log('收到訊息 runTime:', message);
    if (message.action === 'getSnippetByShortcut') {
      console.log('shortcuts 觸發:', message.shortcut);
      const snippet = folders.flatMap(folder => folder.snippets).find(snippet => snippet.shortcut === message.shortcut);
      sendResponse({ snippet });
    }
  });

  // 如果不在 DOM 中，直接回傳 null
  if (!isInDOM) {
    return null; // 不在 DOM 中就不 render
  }

  // 動態設定 CSS 類別
  const panelClasses = `
    slide-panel
    ${alignment} 
    ${isAnimating ? 'visible bg-white' : ''}
    ${noAnimation ? 'no-animation' : ''}
  `;

  return (
    <div
      ref={panelRef}
      className={panelClasses}
      onMouseEnter={() => onHover(panelRef.current)}
      onMouseLeave={() => onHover(null)}
      onTransitionEnd={() => {
        // 只處理 transform 的 transitionEnd
        if (!isAnimating) {
          // 代表現在是滑出結束 → 從 DOM 中移除
          setIsInDOM(false);
        }
      }}>
      {/* Header */}
      <Header goToDashboard={goToDashboard} />
      {/* snippets List*/}
      <div className="content-area overflow-y-auto bg-white p-2">
        <h2 className="mb-2 text-lg font-semibold text-black">Snippets</h2>
        <ul className="text-black">
          {folders.map(folder => (
            <li key={folder.id} className="mb-2">
              <div
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
              </div>
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
                              onMouseDown={e => {
                                // e.preventDefault(); // Prevent focus change
                                insertPrompt(snippet.id, e);
                              }}>
                              <FaArrowAltCircleDown className="mr-1 inline-block text-slate-700" size={20} />
                            </button>
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

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
