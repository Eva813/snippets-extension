import { withErrorBoundary, withSuspense } from '@extension/shared';
import { useState, useEffect, useRef } from 'react';
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

  const [folders, setFolders] = useState<
    Array<{
      id: string;
      name: string;
      description: string;
      snippets: Array<{
        id: string;
        name: string;
        content: string;
        shortcut: string;
      }>;
    }>
  >([]);

  // 元件掛載時取得資料夾

  const fetchFolders = async () => {
    chrome.runtime.sendMessage(
      { type: 'GET_FOLDERS' },
      (response: {
        success: boolean;
        data?: Array<{
          id: string;
          name: string;
          description: string;
          snippets: Array<{
            id: string;
            name: string;
            content: string;
            shortcut: string;
          }>;
        }>;
        error?: string;
      }) => {
        if (response.success) {
          setFolders(response.data || []);
        } else {
          // 載入失敗時使用預設資料
          setFolders([
            {
              id: 'HplOMyf2mDqvVMdphJbt',
              name: 'My Sample Snippets',
              description: 'This is a sample folder',
              snippets: [
                {
                  id: '5mJw031VPo2WxNIQyeXN',
                  name: 'Demo - Plain text',
                  content: '<p>be a software engineer, familiar with vue, react</p>',
                  shortcut: '/do',
                },
                {
                  id: '6mJw031VPo2WxNIQyeYN',
                  name: 'Demo - Styled Text',
                  content: '<p>be a translate expert, I will give you a sentence and help me translate to english</p>',
                  shortcut: '/ih',
                },
              ],
            },
          ]);
        }
      },
    );
  };
  useEffect(() => {
    fetchFolders();
  }, []);
  //  ==========  將 snippet 存到 storage ==========
  useEffect(() => {
    const validFolders = Array.isArray(folders) ? folders : [];
    if (validFolders.length <= 0) {
      // 修正條件，應該是 <= 0
      console.log('data');
      chrome.runtime.sendMessage({ action: 'updateIcon', hasFolders: false });
    } else {
      chrome.runtime.sendMessage({ action: 'updateIcon', hasFolders: true });
      const snippetsMap = validFolders.reduce<Record<string, (typeof folders)[0]['snippets'][0]>>((acc, folder) => {
        folder.snippets.forEach(snippet => {
          acc[snippet.shortcut] = snippet;
        });
        return acc;
      }, {});

      chrome.storage.local.set({ snippets: snippetsMap }, () => {
        if (import.meta.env.MODE === 'development') {
          console.log('Snippets saved to storage:', snippetsMap);
        }
      });
    }
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
      // 只處理 getSnippetByShortcut 動作
      if (isSnippetShortcutMessage(message)) {
        const snippet = folders
          .flatMap(folder => folder.snippets)
          .find(snippet => snippet.shortcut === message.shortcut);
        sendResponse({ snippet });
        return true; // 表示會以非同步方式回應
      }
      return false;
    };

    chrome.runtime.onMessage.addListener(handleMessage);

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
        () => {},
      );
    } else {
      // 有表單欄位，仍透過背景建立 popup
      const content = snippet.content;
      chrome.runtime.sendMessage({ action: 'createWindow', title, content }, response => {
        if (import.meta.env.MODE === 'development') {
          console.log('Window creation response:', response);
        }
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
    return null;
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
