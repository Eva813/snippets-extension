// import '@src/SidePanel.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { useState, useEffect, useMemo, useRef } from 'react';
import Header from './components/Header';
import type { MessageEvent, SnippetShortcutMessage, SnippetResponse } from '@src/types';
import ToggleSidebarButton from '@src/components/toggleSidebarButton';
import FolderList from './components/folderList';

interface SidePanelProps extends Record<string, unknown> {
  alignment: 'left' | 'right';
  visible: boolean;
  isInDOM: boolean;
  isAnimating: boolean;
  noAnimation: boolean;
  setIsInDOM: (value: boolean) => void;
  toggleAlignment: () => void;
  onHover: (element: HTMLElement | null) => void;
  onToggle: () => void;
}

const SidePanel: React.FC<SidePanelProps> = ({
  alignment,
  visible,
  displayMode,
  isInDOM,
  isAnimating,
  noAnimation,
  setIsInDOM,
  onHover,
  onToggle,
}) => {
  const goToDashboard = () => window.open('https://linxly-nextjs.vercel.app/', '_blank');
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [hoveredSnippetId, setHoveredSnippetId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
            shortcut: '@bt',
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
            shortcut: '#Gt',
          },
        ],
      },
    ],
    [],
  );
  //  ==========  將 snippet 存到 storage ==========
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

  //  ========== 接收背景訊息 接收取得 snippetByShortcut ==========
  useEffect(() => {
    // 檢查訊息是否為 SnippetShortcutMessage 的類型保護函式
    function isSnippetShortcutMessage(message: MessageEvent): message is SnippetShortcutMessage {
      return message.action === 'getSnippetByShortcut' && typeof message.shortcut === 'string';
    }

    // 訊息處理函式
    const handleMessage = (
      message: MessageEvent,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: SnippetResponse) => void,
    ) => {
      // 明確排除 toggleSlidePanel 訊息，避免重複處理
      if (message.action === 'toggleSlidePanel') {
        return false;
      }
      // 只處理 getSnippetByShortcut 動作，避免顯示過多日誌
      if (isSnippetShortcutMessage(message)) {
        console.log('shortcuts 觸發:', message.shortcut);
        const snippet = folders
          .flatMap(folder => folder.snippets)
          .find(snippet => snippet.shortcut === message.shortcut);
        sendResponse({ snippet });
        return true; // 表示會以非同步方式回應
      }
      return false;
    };

    // 註冊監聽器
    chrome.runtime.onMessage.addListener(handleMessage);

    // 清理：元件卸載時移除監聽器
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [folders]);

  // ========== 插入 snippet ==========
  const insertPrompt = (id: string, event: React.MouseEvent) => {
    if (event && event.preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }
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

  // ========== 摺疊 folder ==========
  const toggleCollapse = (folderId: string) => {
    const newCollapsed = new Set(collapsedFolders);
    if (newCollapsed.has(folderId)) {
      newCollapsed.delete(folderId);
    } else {
      newCollapsed.add(folderId);
    }
    setCollapsedFolders(newCollapsed);
  };

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
      data-display-mode={displayMode}
      onTransitionEnd={() => {
        // 只處理 transform 的 transitionEnd
        if (!isAnimating) {
          // 代表現在是滑出結束 → 從 DOM 中移除
          setIsInDOM(false);
        }
      }}>
      {/* 側邊欄切換按鈕 - 固定在面板外側 */}
      <div
        className="sidebar-toggle-container"
        onMouseEnter={e => {
          e.stopPropagation(); // 阻止事件冒泡
          onHover(null);
        }}
        onMouseLeave={e => {
          e.stopPropagation(); // 阻止事件冒泡
        }}>
        <ToggleSidebarButton alignment={alignment} visible={visible} onToggle={onToggle} />
      </div>
      {/* Header */}
      <Header goToDashboard={goToDashboard} />
      {/* snippets List*/}
      <div className="content-area overflow-y-auto bg-white p-2">
        <FolderList
          folders={folders}
          collapsedFolders={collapsedFolders}
          toggleCollapse={toggleCollapse}
          hoveredSnippetId={hoveredSnippetId}
          setHoveredSnippetId={setHoveredSnippetId}
          insertPrompt={id => insertPrompt(id, {} as React.MouseEvent)}
        />
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
