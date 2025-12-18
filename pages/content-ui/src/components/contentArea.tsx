import React from 'react';
import FolderList from './folderList';
import LoadingState from './loadingState';
import ErrorState from './errorState';
import type { ContentAreaProps } from '../types/sidePanel';

const ContentArea: React.FC<ContentAreaProps> = ({
  folders,
  isLoading,
  loadError,
  collapsedFolders,
  hoveredPromptId,
  searchQuery,
  onToggleCollapse,
  onSetHoveredPromptId,
  onInsertPrompt,
  onRetry,
}) => {
  return (
    <div className="bg-white p-2 dark:bg-gray-700 dark:text-white">
      {isLoading && folders.length === 0 ? (
        <LoadingState />
      ) : loadError ? (
        <ErrorState error={loadError} onRetry={onRetry} />
      ) : (
        <FolderList
          folders={folders}
          collapsedFolders={collapsedFolders}
          toggleCollapse={onToggleCollapse}
          hoveredPromptId={hoveredPromptId}
          searchQuery={searchQuery}
          setHoveredPromptId={onSetHoveredPromptId}
          insertPrompt={id => onInsertPrompt(id, {} as React.MouseEvent)}
        />
      )}
    </div>
  );
};

export default ContentArea;
