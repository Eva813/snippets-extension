import { memo, useState } from 'react';
import { FaArrowLeft, FaUser, FaArrowAltCircleDown } from 'react-icons/fa';
import CenteredContainer from './centeredContainer';
import LoadingState from '../loadingState';
import ErrorState from '../errorState';
import { UI_TEXT, LOADING_MESSAGES } from '../../constants/sidePanel';
import { insertSharedPrompt } from '../../utils/sidePanel';
import type { SharedFolderDetailResponse } from '../../types/sidePanel';

interface PromptsViewProps {
  promptsLoading: boolean;
  promptsError: string | null;
  selectedFolder: SharedFolderDetailResponse | null;
  onBack: () => void;
  onClose: () => void;
}

const PromptsView = memo<PromptsViewProps>(({ promptsLoading, promptsError, selectedFolder, onBack }) => {
  const [hoveredPromptId, setHoveredPromptId] = useState<string | null>(null);

  // Handle loading state
  if (promptsLoading) {
    return (
      <CenteredContainer>
        <LoadingState message={LOADING_MESSAGES.LOADING_FOLDER_DETAILS} />
      </CenteredContainer>
    );
  }

  // Handle error state
  if (promptsError) {
    return (
      <CenteredContainer>
        <ErrorState error={promptsError} onRetry={onBack} />
      </CenteredContainer>
    );
  }

  // Handle no folder selected
  if (!selectedFolder) {
    return null;
  }

  const handlePromptInsert = (
    prompt: SharedFolderDetailResponse['prompts'][number],
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    insertSharedPrompt(prompt, e);
    //onClose(); // Close modal after inserting prompt
  };

  const getPermissionText = () => {
    return selectedFolder.permission === 'edit' ? UI_TEXT.PERMISSION_EDIT : UI_TEXT.PERMISSION_VIEW;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header with back button */}
      <div className="flex items-center space-x-3 border-b border-gray-200 p-2 dark:border-gray-700">
        <button
          onClick={onBack}
          className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300">
          <FaArrowLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-gray-900 dark:text-white">{selectedFolder.name}</h3>
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <FaUser size={10} />
              <span className="truncate">
                {UI_TEXT.SHARED_BY} {selectedFolder.sharedFrom}
              </span>
            </div>
            <span>•</span>
            <span>{getPermissionText()}</span>
          </div>
        </div>
      </div>

      {/* Prompts list */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedFolder.prompts.length === 0 ? (
          <div className="flex h-60 items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">No prompts in this folder</p>
          </div>
        ) : (
          <ul className="space-y-0">
            {selectedFolder.prompts.map(prompt => (
              <li
                key={prompt.id}
                className="mb-2"
                onMouseEnter={() => setHoveredPromptId(prompt.id)}
                onMouseLeave={() => setHoveredPromptId(null)}>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between rounded p-2 hover:bg-gray-100 focus:outline-none dark:hover:bg-gray-700 dark:hover:text-black"
                  onMouseDown={e => handlePromptInsert(prompt, e)}>
                  {/* Left side: Prompt name */}
                  <div className="flex min-w-0 flex-1 items-center space-x-2">
                    <span className="truncate text-sm font-medium text-gray-900 dark:text-white">{prompt.name}</span>
                  </div>

                  {/* Right side: Insert icon and shortcut */}
                  <div className="ml-2 flex shrink-0 items-center space-x-2">
                    <div className="relative">
                      <div
                        className={`flex items-center justify-center transition-opacity duration-200 ${
                          hoveredPromptId === prompt.id ? 'visible opacity-100' : 'invisible opacity-0'
                        }`}>
                        <FaArrowAltCircleDown size={16} className="text-primary" />
                      </div>
                    </div>
                    {prompt.shortcut && (
                      <span className="inline-flex h-5 max-w-[80px] items-center rounded-full border border-blue-300 px-2 py-0.5 text-xs font-medium text-black dark:text-white">
                        <span className="block truncate">{prompt.shortcut}</span>
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

PromptsView.displayName = 'PromptsView';

export default PromptsView;
