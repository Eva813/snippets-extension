import '@src/SidePanel.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { useState, useEffect, useMemo } from 'react';
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
            id: '6mJw031VPo2WxNIQyeYN',
            name: 'Demo - Styled Text',
            content: 'be a translate expert, I will give you a sentence and help me translate to english',
            shortcut: '/ih',
          },
          {
            name: 'New bb',
            content:
              '<p>test </p><p><span data-type="formmenu" data-snippet="{&quot;type&quot;:&quot;formmenu&quot;,&quot;spec&quot;:{&quot;positional&quot;:[0,0],&quot;named&quot;:{&quot;options&quot;:{&quot;type&quot;:&quot;string&quot;,&quot;list&quot;:&quot;positional&quot;,&quot;priority&quot;:-1,&quot;placeholder&quot;:&quot;Placeholder&quot;,&quot;description&quot;:&quot;The menu options&quot;},&quot;name&quot;:{&quot;priority&quot;:2,&quot;description&quot;:&quot;Name of the form field&quot;,&quot;placeholder&quot;:&quot;Label&quot;,&quot;type&quot;:&quot;string&quot;,&quot;static&quot;:true},&quot;default&quot;:{&quot;type&quot;:&quot;string&quot;,&quot;constant&quot;:true,&quot;priority&quot;:2,&quot;placeholder&quot;:&quot;Placeholder&quot;,&quot;description&quot;:&quot;The default value for the field&quot;},&quot;multiple&quot;:{&quot;type&quot;:&quot;boolean&quot;,&quot;constant&quot;:true,&quot;priority&quot;:1.4,&quot;placeholder&quot;:&quot;yes&quot;,&quot;description&quot;:&quot;Whether the user can select multiple items&quot;}}},&quot;commandName&quot;:&quot;formmenu&quot;,&quot;addon_id&quot;:null,&quot;icon_url&quot;:null,&quot;hasMatchingTokens&quot;:false,&quot;attributes&quot;:[{&quot;name&quot;:&quot;options&quot;,&quot;value&quot;:[&quot;Choice 1&quot;,&quot;Choice 2&quot;,&quot;test&quot;]},{&quot;name&quot;:&quot;name&quot;,&quot;value&quot;:&quot;testOption&quot;},{&quot;name&quot;:&quot;default&quot;,&quot;value&quot;:&quot;Choice 2&quot;},{&quot;name&quot;:&quot;multiple&quot;,&quot;value&quot;:false}]}"></span></p>',
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
    // Prevent default button behavior
    event.preventDefault();
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
          // 發送訊息給 background，讓它暫存轉換後的資料，並建立 popup
          const content = snippet.content;
          chrome.runtime.sendMessage({ action: 'createWindow', title, content }, response => {
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
    if (message.action === 'getSnippetByShortcut') {
      console.log('shortcuts 觸發:', message.shortcut);
      const snippet = folders.flatMap(folder => folder.snippets).find(snippet => snippet.shortcut === message.shortcut);
      sendResponse({ snippet });
    }
  });

  return (
    <div className="flex h-[500px]">
      {/* onMouseDown={(e) =>  e.preventDefault()} */}
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
                              onMouseDown={e => {
                                e.preventDefault(); // Prevent focus change
                                insertPrompt(snippet.id, e);
                              }}>
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

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
