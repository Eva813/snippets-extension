import { withErrorBoundary, withSuspense } from '@extension/shared';
import { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import ToggleSidebarButton from '@src/components/toggleSidebarButton';
import FolderList from './components/folderList';
import PromptSpaceSelector from './components/PromptSpaceSelector';
import { AiOutlineWarning } from 'react-icons/ai';

interface SidePanelProps extends Record<string, unknown> {
  alignment: 'left' | 'right';
  visible: boolean;
  displayMode: 'overlay' | 'push';
  isInDOM: boolean;
  isAnimating: boolean;
  noAnimation: boolean;
  setIsInDOM: (value: boolean) => void;
  onToggle: () => void;
  toggleDisplayMode: () => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}

const SidePanel: React.FC<SidePanelProps> = ({
  alignment,
  visible,
  displayMode,
  isInDOM,
  isAnimating,
  noAnimation,
  setIsInDOM,
  onToggle,
  toggleDisplayMode,
  containerRef,
}) => {
  const goToDashboard = () => window.open('https://linxly-nextjs.vercel.app/', '_blank');
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [hoveredPromptId, setHoveredPromptId] = useState<string | null>(null);
  const defaultPanelRef = useRef<HTMLDivElement>(null);
  // 使用傳入的 containerRef 或預設的 ref
  const panelRef = containerRef || defaultPanelRef;

  const [folders, setFolders] = useState<
    Array<{
      id: string;
      name: string;
      description: string;
      prompts: Array<{
        id: string;
        name: string;
        content: string;
        shortcut: string;
      }>;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const INITIAL_SPACE_ID = '__initial__';
  const [selectedPromptSpace, setSelectedPromptSpace] = useState<string>(INITIAL_SPACE_ID);
  const [promptSpaces, setPromptSpaces] = useState<
    Array<{
      id: string;
      name: string;
      type: 'my' | 'shared';
      isReadOnly?: boolean;
    }>
  >([]);

  // Fetch prompt spaces
  const fetchPromptSpaces = useCallback(async () => {
    try {
      chrome.runtime.sendMessage(
        { action: 'getPromptSpaces' },
        (response: {
          success: boolean;
          data?: {
            ownedSpaces: Array<{
              id: string;
              name: string;
              userId: string;
              createdAt: string;
              updatedAt?: string;
              defaultSpace?: boolean;
            }>;
            sharedSpaces: Array<{
              space: {
                id: string;
                name: string;
                userId: string;
                createdAt: string;
                updatedAt?: string;
                defaultSpace?: boolean;
              };
              permission: 'view' | 'edit';
              sharedBy: string;
              sharedAt: string;
            }>;
          };
          error?: string;
        }) => {
          if (response && response.success && response.data) {
            // Convert API response to component format
            const spaces = [
              ...response.data.ownedSpaces.map(space => ({
                id: space.id,
                name: space.name,
                type: 'my' as const,
              })),
              ...response.data.sharedSpaces.map(sharedSpace => ({
                id: sharedSpace.space.id,
                name: sharedSpace.space.name,
                type: 'shared' as const,
                isReadOnly: sharedSpace.permission === 'view',
              })),
            ];
            setPromptSpaces(spaces);

            // Set default selected space if none selected (initial load only)
            if (selectedPromptSpace === INITIAL_SPACE_ID && spaces.length > 0) {
              // First try to find a space with defaultSpace: true
              const defaultSpace = [...response.data.ownedSpaces, ...response.data.sharedSpaces.map(s => s.space)].find(
                space => space.defaultSpace === true,
              );

              let selectedSpaceId: string;
              if (defaultSpace) {
                selectedSpaceId = defaultSpace.id;
                setSelectedPromptSpace(selectedSpaceId);
              } else {
                // Fallback to first available space
                selectedSpaceId = spaces[0].id;
                setSelectedPromptSpace(selectedSpaceId);
              }

              // Auto-fetch data for the selected space (only on initial load)
              fetchFoldersForSpace(selectedSpaceId);
              setHasInitialized(true);
            } else {
              // If not initial load, still mark as initialized
              setHasInitialized(true);
            }
          }
        },
      );
    } catch (error) {
      console.error('Error fetching prompt spaces:', error);
    }
  }, [selectedPromptSpace]);

  useEffect(() => {
    // 只在第一次顯示或沒有資料時載入
    if (visible && isInDOM && !hasInitialized) {
      fetchPromptSpaces(); // 這會自動選定空間並載入該空間的資料
    }
  }, [visible, isInDOM, hasInitialized, fetchPromptSpaces]);

  // Handle prompt space change and fetch data
  const handlePromptSpaceChange = (spaceId: string) => {
    console.log('Changing prompt space to:', spaceId);
    setSelectedPromptSpace(spaceId);
  };

  const handleFetchDataForSpace = (spaceId: string) => {
    console.log('Fetching data for space:', spaceId);
    // Fetch folders for the specific prompt space
    fetchFoldersForSpace(spaceId);
  };

  // Fetch folders for a specific prompt space
  const fetchFoldersForSpace = async (promptSpaceId: string) => {
    setIsLoading(true);
    setLoadError(null);

    try {
      chrome.runtime.sendMessage(
        { action: 'getSpaceFolders', promptSpaceId },
        (response: {
          success: boolean;
          data?: Array<{
            id: string;
            name: string;
            description: string;
            prompts: Array<{
              id: string;
              name: string;
              content: string;
              shortcut: string;
            }>;
          }>;
          error?: string;
        }) => {
          setIsLoading(false);
          if (response && response.success && response.data) {
            setFolders(response.data);
          } else {
            const errorMsg = response?.error || 'Failed to fetch folders for space';
            console.error('Failed to fetch folders for space:', errorMsg);
            setLoadError(errorMsg);
            setFolders([]);
          }
        },
      );
    } catch (error) {
      setIsLoading(false);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setLoadError(errorMsg);
      console.error('Error occurred while loading folders for space:', error);
    }
  };

  // Reload all data: prompt spaces, folders, and prompts
  const handleReload = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      // 1. Reload prompt spaces list (may have new/deleted spaces)
      await fetchPromptSpaces();

      // 2. If we have a valid selected space, reload its data
      if (selectedPromptSpace && selectedPromptSpace !== INITIAL_SPACE_ID) {
        // Verify the selected space still exists in the updated spaces list
        const spaceStillExists = promptSpaces.some(space => space.id === selectedPromptSpace);
        if (spaceStillExists) {
          await fetchFoldersForSpace(selectedPromptSpace);
        } else {
          // Selected space no longer exists, reset to initial state
          setSelectedPromptSpace(INITIAL_SPACE_ID);
          setFolders([]);
          setHasInitialized(false); // Trigger re-initialization
        }
      }
    } catch (error) {
      console.error('Error during reload:', error);
      setLoadError('Failed to reload data');
    } finally {
      setIsLoading(false);
    }
  };
  //  ==========  將 prompt 存到 storage ==========
  useEffect(() => {
    const validFolders = Array.isArray(folders) ? folders : [];
    if (validFolders.length <= 0) {
      chrome.runtime.sendMessage({ action: 'updateIcon', hasFolders: false });
    } else {
      chrome.runtime.sendMessage({ action: 'updateIcon', hasFolders: true });

      // 檢查是否需要更新 prompts（避免重複更新）
      chrome.storage.local.get(['prompts'], result => {
        const promptsMap = validFolders.reduce<Record<string, (typeof folders)[0]['prompts'][0]>>((acc, folder) => {
          folder.prompts.forEach(prompt => {
            acc[prompt.shortcut] = prompt;
          });
          return acc;
        }, {});

        // 只有在 prompts 有變化時才更新
        const currentPromptsString = JSON.stringify(result.prompts || {});
        const newPromptsString = JSON.stringify(promptsMap);

        if (currentPromptsString !== newPromptsString) {
          chrome.storage.local.set({ prompts: promptsMap }, () => {
            if (import.meta.env.MODE === 'development') {
              console.log('dev mode: Prompts saved to storage,', promptsMap);
            }
          });
        }
      });
    }
  }, [folders]);

  // ========== 插入 prompt ==========
  const insertPrompt = (id: string, event: React.MouseEvent) => {
    if (event && event.preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }

    const prompt = folders.flatMap(folder => folder.prompts).find(prompt => prompt.id === id);
    if (!prompt) {
      console.warn('Prompt not found.');
      return;
    }

    // 檢查 prompt.content 是否包含 'data-prompt'
    const hasFormField = prompt.content.includes('data-prompt');
    const title = `${prompt.shortcut} - ${prompt.name}`;

    if (!hasFormField) {
      // 沒有表單欄位，改由傳送訊息給背景，由背景呼叫 chrome.tabs.query
      chrome.runtime.sendMessage(
        {
          action: 'sidePanelInsertPrompt',
          prompt: {
            content: prompt.content,
            shortcut: prompt.shortcut,
            name: prompt.name,
          },
        },
        () => {},
      );
    } else {
      // 有表單欄位，仍透過背景建立 popup
      const content = prompt.content;
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
    extension-container slide-panel overflow-visible
    ${alignment} 
    ${visible && isAnimating ? 'visible bg-white' : ''}
    ${noAnimation ? 'no-animation' : ''}
  `
    .trim()
    .replace(/\s+/g, ' ');

  return (
    <div
      ref={panelRef}
      className={panelClasses}
      data-display-mode={displayMode}
      onTransitionEnd={e => {
        // 只處理 transform 的 transitionEnd，避免其他元素的 transition 干擾
        if (e.propertyName === 'transform' && e.target === panelRef.current) {
          if (!isAnimating && !visible) {
            // 代表現在是滑出結束 → 從 DOM 中移除
            setIsInDOM(false);
          }
        }
      }}>
      {/* 側邊欄切換按鈕 - 固定在面板外側 */}
      <div className="sidebar-toggle-container">
        <ToggleSidebarButton alignment={alignment} visible={visible} onToggle={onToggle} />
      </div>
      {/* Header */}
      <Header
        goToDashboard={goToDashboard}
        onReload={handleReload}
        displayMode={displayMode}
        toggleDisplayMode={toggleDisplayMode}
      />

      {/* Prompt Space Selection */}
      <PromptSpaceSelector
        selectedSpaceId={selectedPromptSpace}
        onSpaceChange={handlePromptSpaceChange}
        onFetchData={handleFetchDataForSpace}
        spaces={promptSpaces}
      />

      {/* prompts List*/}
      <div className="content-area overflow-y-auto bg-white p-2">
        {isLoading && folders.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading Prompts...</div>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AiOutlineWarning className="mb-4 text-4xl text-gray-500" />
            <div className="mb-2 text-center text-gray-500">Something went wrong</div>
            <div className="mb-2 text-center text-sm text-gray-400">
              {`We're having trouble loading this content. Please check your connection and try again.`}
            </div>
            <button
              onClick={() => fetchFoldersForSpace(selectedPromptSpace)}
              className="rounded bg-slate-500 px-4 py-2 text-white hover:bg-slate-600">
              Try Again
            </button>
          </div>
        ) : (
          <FolderList
            folders={folders}
            collapsedFolders={collapsedFolders}
            toggleCollapse={toggleCollapse}
            hoveredPromptId={hoveredPromptId}
            setHoveredPromptId={setHoveredPromptId}
            insertPrompt={id => insertPrompt(id, {} as React.MouseEvent)}
          />
        )}
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
