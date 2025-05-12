import { withErrorBoundary, withSuspense } from '@extension/shared';
import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
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

  const fetchFolders = async () => {
    console.log('開始執行側邊面板的 fetchFolders');
    // 先從 chrome.storage 中檢查是否已有資料
    chrome.storage.local.get(['folders', 'hasFolders'], async result => {
      console.log('從 storage 讀取的資料:', result);

      if (result.folders && Array.isArray(result.folders) && result.folders.length > 0) {
        console.log('從 storage 中載入資料夾:', result.folders);
        setFolders(result.folders);
      } else {
        console.log('Storage 中沒有資料夾或為空，向背景腳本請求');
        // 如果 storage 中沒有資料，則向 API 發送請求
        chrome.runtime.sendMessage(
          { action: 'GET_FOLDERS' },
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
            console.log('GET_FOLDERS 回應:', response);
            if (response && response.success && response.data) {
              console.log('成功從背景腳本獲取資料夾:', response.data);
              setFolders(response.data);
              // 將資料存入 storage
              chrome.storage.local.set({ folders: response.data, hasFolders: response.data.length > 0 });
            } else {
              console.error('獲取資料夾失敗:', response?.error);
              // 如果請求失敗，更新圖示狀態
              setFolders([]);
              chrome.runtime.sendMessage({ action: 'updateIcon', hasFolders: false });
            }
          },
        );
      }
    });
  };

  useEffect(() => {
    // 當面板變為可見時重新獲取資料
    if (visible && isInDOM) {
      fetchFolders();
    }
  }, [visible, isInDOM]);
  //  ==========  將 snippet 存到 storage ==========
  useEffect(() => {
    const validFolders = Array.isArray(folders) ? folders : [];
    if (validFolders.length <= 0) {
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
          e.stopPropagation();
          onHover(null);
        }}
        onMouseLeave={e => {
          e.stopPropagation();
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
