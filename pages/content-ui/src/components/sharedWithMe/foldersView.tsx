import { memo } from 'react';
import CenteredContainer from './centeredContainer';
import LoadingState from '../loadingState';
import ErrorState from '../errorState';
import SharedFolderItem from './sharedFolderItem';
import { LOADING_MESSAGES, SHARED_ERROR_MESSAGES } from '../../constants/sidePanel';
import type { SharedFolderItem as SharedFolderItemType } from '../../types/sidePanel';

interface FoldersViewProps {
  loading: boolean;
  error: string | null;
  folders: SharedFolderItemType[];
  totalCount: number;
  onFolderClick: (folderId: string) => void;
  onRetry: () => void;
}

const FoldersView = memo<FoldersViewProps>(({ loading, error, folders, totalCount, onFolderClick, onRetry }) => {
  const renderContent = () => {
    if (loading) {
      return (
        <CenteredContainer>
          <LoadingState message={LOADING_MESSAGES.LOADING_SHARED_FOLDERS} />
        </CenteredContainer>
      );
    }

    if (error) {
      return (
        <CenteredContainer>
          <ErrorState error={error} onRetry={onRetry} />
        </CenteredContainer>
      );
    }

    if (folders.length === 0) {
      return (
        <CenteredContainer>
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {totalCount === 0 ? SHARED_ERROR_MESSAGES.NO_SHARED_FOLDERS : 'Loading...'}
            </p>
          </div>
        </CenteredContainer>
      );
    }

    return (
      <ul className="space-y-0">
        {folders.map((folder: SharedFolderItemType) => (
          <SharedFolderItem key={folder.id} folder={folder} onClick={onFolderClick} />
        ))}
      </ul>
    );
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">{renderContent()}</div>

      {/* Footer */}
      {!loading && !error && folders.length > 0 && (
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalCount} shared folder{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </>
  );
});

FoldersView.displayName = 'FoldersView';

export default FoldersView;
