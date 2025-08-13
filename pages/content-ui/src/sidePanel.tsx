import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { withErrorBoundary, withSuspense } from '@extension/shared';

// Components
import Header from './components/Header';
import ToggleSidebarButton from '@src/components/toggleSidebarButton';
import PromptSpaceSelector from './components/PromptSpaceSelector';
import ContentArea from './components/contentArea';

// Hooks
import { usePromptSpaces } from './hooks/usePromptSpaces';
import { useFolders } from './hooks/useFolders';
import { usePromptStorage } from './hooks/usePromptStorage';

// Types and constants
import type { SidePanelProps } from './types/sidePanel';
import { INITIAL_SPACE_ID, EXTERNAL_URLS, ERROR_MESSAGES } from './constants/sidePanel';
import { insertPrompt, generatePanelClasses, openDashboard } from './utils/sidePanel';

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
  // UI state
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [hoveredPromptId, setHoveredPromptId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const defaultPanelRef = useRef<HTMLDivElement>(null);
  const panelRef = containerRef || defaultPanelRef;

  // Custom hooks
  const {
    promptSpaces,
    selectedPromptSpace,
    hasInitialized,
    setSelectedPromptSpace,
    setHasInitialized,
    fetchPromptSpaces,
    handlePromptSpaceChange,
  } = usePromptSpaces({
    onSpaceSelected: (spaceId: string) => {
      fetchFoldersForSpace(spaceId);
    },
  });

  const { folders, isLoading, loadError, setIsLoading, setLoadError, fetchFoldersForSpace, clearFolders } =
    useFolders();

  // Storage sync
  usePromptStorage({ folders });

  // Initial load effect
  useEffect(() => {
    if (visible && isInDOM && !hasInitialized) {
      fetchPromptSpaces();
    }
  }, [visible, isInDOM, hasInitialized, fetchPromptSpaces]);

  // Event handlers
  const handleFetchDataForSpace = useCallback(
    (spaceId: string) => {
      fetchFoldersForSpace(spaceId);
    },
    [fetchFoldersForSpace],
  );

  const handleReload = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      // 0. 通知 background script 清除快取
      try {
        await new Promise<void>(resolve => {
          chrome.runtime.sendMessage({ action: 'invalidatePromptSpacesCache' }, response => {
            if (response?.success) {
              console.log('🧹 Successfully cleared prompt spaces cache');
            } else {
              console.warn('⚠️ Failed to clear cache, but continuing with reload');
            }
            resolve();
          });
        });
      } catch (cacheError) {
        console.warn('⚠️ Error clearing cache:', cacheError);
        // Continue with reload even if cache clearing fails
      }

      // 1. Reload prompt spaces list (may have new/deleted spaces)
      try {
        await fetchPromptSpaces();
      } catch (spacesError) {
        console.error('Failed to fetch prompt spaces:', spacesError);
        setLoadError(ERROR_MESSAGES.FAILED_TO_RELOAD);
        return; // Exit early if we can't fetch spaces
      }

      // 2. If we have a valid selected space, reload its data
      if (selectedPromptSpace && selectedPromptSpace !== INITIAL_SPACE_ID) {
        try {
          // Verify the selected space still exists in the updated spaces list
          const spaceStillExists = promptSpaces.some(space => space.id === selectedPromptSpace);
          if (spaceStillExists) {
            await fetchFoldersForSpace(selectedPromptSpace);
          } else {
            // Selected space no longer exists, reset to initial state
            console.warn(`Selected space ${selectedPromptSpace} no longer exists, resetting to initial state`);
            setSelectedPromptSpace(INITIAL_SPACE_ID);
            clearFolders();
            setHasInitialized(false); // Trigger re-initialization
          }
        } catch (foldersError) {
          console.error('Failed to fetch folders for space:', foldersError);
          // Don't set error here as we want to allow retry for specific space
          // The folders hook should handle this error state
        }
      }
    } catch (error) {
      console.error('Unexpected error during reload:', error);
      setLoadError(ERROR_MESSAGES.FAILED_TO_RELOAD);
    } finally {
      setIsLoading(false);
    }
  }, [
    fetchPromptSpaces,
    selectedPromptSpace,
    promptSpaces,
    fetchFoldersForSpace,
    setSelectedPromptSpace,
    clearFolders,
    setHasInitialized,
    setIsLoading,
    setLoadError,
  ]);

  const handleInsertPrompt = useCallback(
    (id: string, event: React.MouseEvent) => {
      if (!id || typeof id !== 'string') {
        console.warn('Invalid prompt ID provided to handleInsertPrompt');
        return;
      }
      insertPrompt(folders, id, event);
    },
    [folders],
  );

  const handleToggleCollapse = useCallback((folderId: string) => {
    if (!folderId || typeof folderId !== 'string') {
      console.warn('Invalid folder ID provided to handleToggleCollapse');
      return;
    }

    setCollapsedFolders(prev => {
      const newCollapsed = new Set(prev);
      if (newCollapsed.has(folderId)) {
        newCollapsed.delete(folderId);
      } else {
        newCollapsed.add(folderId);
      }
      return newCollapsed;
    });
  }, []);

  const handleRetry = useCallback(() => {
    if (selectedPromptSpace && selectedPromptSpace !== INITIAL_SPACE_ID) {
      fetchFoldersForSpace(selectedPromptSpace);
    }
  }, [selectedPromptSpace, fetchFoldersForSpace]);

  const goToDashboard = useCallback(() => {
    openDashboard(EXTERNAL_URLS.DASHBOARD);
  }, []);

  // Search functionality
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Filter folders based on search query
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) {
      return folders;
    }

    const lowerQuery = searchQuery.toLowerCase();

    return folders.filter(folder => {
      // Check folder name
      if (folder.name.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Check if any prompt in this folder matches
      return folder.prompts.some(
        prompt =>
          prompt.name.toLowerCase().includes(lowerQuery) ||
          prompt.content.toLowerCase().includes(lowerQuery) ||
          prompt.shortcut.toLowerCase().includes(lowerQuery),
      );
    });
  }, [folders, searchQuery]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Handle Escape key to close panel
      if (event.key === 'Escape' && visible) {
        event.preventDefault();
        onToggle();
        return;
      }

      // Handle keyboard shortcuts for refresh
      if (event.key === 'r' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        handleReload();
        return;
      }
    },
    [visible, onToggle, handleReload],
  );

  // Early return if not in DOM
  if (!isInDOM) {
    return null;
  }

  // Generate panel classes
  const panelClasses = generatePanelClasses(alignment, visible, isAnimating, noAnimation);

  return (
    <div
      ref={panelRef}
      className={panelClasses}
      data-display-mode={displayMode}
      role="dialog"
      aria-label="Snippets side panel"
      aria-hidden={!visible}
      onTransitionEnd={e => {
        // Only handle transform transitionEnd to avoid interference from other elements
        if (e.propertyName === 'transform' && e.target === panelRef.current) {
          if (!isAnimating && !visible) {
            // Animation finished sliding out → remove from DOM
            setIsInDOM(false);
          }
        }
      }}>
      {/* Accessibility: hidden button for keyboard navigation */}
      {visible && (
        <button
          type="button"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
          aria-hidden="true"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        />
      )}
      {/* Sidebar toggle button - fixed outside panel */}
      <div className="sidebar-toggle-container" role="navigation" aria-label="Sidebar toggle">
        <ToggleSidebarButton alignment={alignment} visible={visible} onToggle={onToggle} />
      </div>

      {/* Header */}
      <Header
        goToDashboard={goToDashboard}
        onReload={handleReload}
        displayMode={displayMode}
        toggleDisplayMode={toggleDisplayMode}
        onSearchChange={handleSearchChange}
      />

      {/* Prompt Space Selection */}
      <div role="region" aria-label="Prompt space selection">
        <PromptSpaceSelector
          selectedSpaceId={selectedPromptSpace}
          onSpaceChange={handlePromptSpaceChange}
          onFetchData={handleFetchDataForSpace}
          spaces={promptSpaces}
        />
      </div>

      {/* Content Area */}
      <div role="main" aria-label="Snippets content">
        <ContentArea
          folders={filteredFolders}
          isLoading={isLoading}
          loadError={loadError}
          collapsedFolders={collapsedFolders}
          hoveredPromptId={hoveredPromptId}
          searchQuery={searchQuery}
          onToggleCollapse={handleToggleCollapse}
          onSetHoveredPromptId={setHoveredPromptId}
          onInsertPrompt={handleInsertPrompt}
          onRetry={handleRetry}
        />
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
