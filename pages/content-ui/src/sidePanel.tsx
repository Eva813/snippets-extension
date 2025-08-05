import React, { useState, useRef, useEffect } from 'react';
import { withErrorBoundary, withSuspense } from '@extension/shared';
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
  const handleFetchDataForSpace = (spaceId: string) => {
    fetchFoldersForSpace(spaceId);
  };

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
          clearFolders();
          setHasInitialized(false); // Trigger re-initialization
        }
      }
    } catch (error) {
      console.error('Error during reload:', error);
      setLoadError(ERROR_MESSAGES.FAILED_TO_RELOAD);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertPrompt = (id: string, event: React.MouseEvent) => {
    insertPrompt(folders, id, event);
  };

  const handleToggleCollapse = (folderId: string) => {
    const newCollapsed = new Set(collapsedFolders);
    if (newCollapsed.has(folderId)) {
      newCollapsed.delete(folderId);
    } else {
      newCollapsed.add(folderId);
    }
    setCollapsedFolders(newCollapsed);
  };

  const handleRetry = () => {
    if (selectedPromptSpace && selectedPromptSpace !== INITIAL_SPACE_ID) {
      fetchFoldersForSpace(selectedPromptSpace);
    }
  };

  const goToDashboard = () => {
    openDashboard(EXTERNAL_URLS.DASHBOARD);
  };

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
      onTransitionEnd={e => {
        // Only handle transform transitionEnd to avoid interference from other elements
        if (e.propertyName === 'transform' && e.target === panelRef.current) {
          if (!isAnimating && !visible) {
            // Animation finished sliding out → remove from DOM
            setIsInDOM(false);
          }
        }
      }}>
      {/* Sidebar toggle button - fixed outside panel */}
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

      {/* Content Area */}
      <ContentArea
        folders={folders}
        isLoading={isLoading}
        loadError={loadError}
        collapsedFolders={collapsedFolders}
        hoveredPromptId={hoveredPromptId}
        onToggleCollapse={handleToggleCollapse}
        onSetHoveredPromptId={setHoveredPromptId}
        onInsertPrompt={handleInsertPrompt}
        onRetry={handleRetry}
      />
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
