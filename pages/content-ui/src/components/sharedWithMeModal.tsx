import { memo, useState, useCallback } from 'react';
import { IoReload, IoCloseSharp } from 'react-icons/io5';
import { useSharedFolders } from '../hooks/useSharedFolders';
import FoldersView from './sharedWithMe/foldersView';
import PromptsView from './sharedWithMe/promptsView';
import { UI_TEXT } from '../constants/sidePanel';
import type { SharedFolderDetailResponse } from '../types/sidePanel';

interface SharedWithMeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SharedWithMeModal = memo<SharedWithMeModalProps>(({ isOpen, onClose }) => {
  const [currentView, setCurrentView] = useState<'folders' | 'prompts'>('folders');
  const [selectedFolder, setSelectedFolder] = useState<SharedFolderDetailResponse | null>(null);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [promptsError, setPromptsError] = useState<string | null>(null);

  const { sharedFolders, loading, error, totalCount, refreshSharedFolders, getSharedFolderDetails, clearError } =
    useSharedFolders();

  const handleRefresh = useCallback(async () => {
    clearError();
    await refreshSharedFolders();
  }, [clearError, refreshSharedFolders]);

  const handleFolderClick = useCallback(
    async (folderId: string) => {
      setPromptsLoading(true);
      setPromptsError(null);

      try {
        const folderDetails = await getSharedFolderDetails(folderId);
        if (folderDetails) {
          setSelectedFolder(folderDetails);
          setCurrentView('prompts');
        } else {
          setPromptsError('Failed to load folder details');
        }
      } catch (err) {
        setPromptsError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setPromptsLoading(false);
      }
    },
    [getSharedFolderDetails],
  );

  const handleBackToFolders = useCallback(() => {
    setCurrentView('folders');
    setSelectedFolder(null);
    setPromptsError(null);
  }, []);

  // No search functionality, use all shared folders
  const filteredFolders = sharedFolders;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="relative mx-2 flex h-[85dvh] w-full max-w-md flex-col rounded-md bg-white shadow-md dark:bg-gray-800">
        {/* Header */}
        {currentView === 'folders' && (
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
            <h2 className="text-lg text-gray-900 dark:text-white">{UI_TEXT.SHARED_WITH_ME}</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="rounded-md p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title="Refresh shared folders">
                <IoReload className={`size-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="rounded-md p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                <IoCloseSharp className="size-5" />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {currentView === 'folders' ? (
          <FoldersView
            loading={loading}
            error={error}
            folders={filteredFolders}
            totalCount={totalCount}
            onFolderClick={handleFolderClick}
            onRetry={handleRefresh}
          />
        ) : (
          <PromptsView
            promptsLoading={promptsLoading}
            promptsError={promptsError}
            selectedFolder={selectedFolder}
            onBack={handleBackToFolders}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
});

SharedWithMeModal.displayName = 'SharedWithMeModal';

export default SharedWithMeModal;
