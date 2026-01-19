import { memo } from 'react';
import { FaFolder, FaUser, FaEye, FaEdit } from 'react-icons/fa';
import type { SharedFolderItem } from '../../types/sidePanel';

interface SharedFolderItemProps {
  folder: SharedFolderItem;
  onClick: (folderId: string) => void;
}

const SharedFolderItemComponent = memo<SharedFolderItemProps>(({ folder, onClick }) => {
  const getPermissionIcon = () => {
    return folder.permission === 'edit' ? (
      <FaEdit size={14} className="text-emerald-600" />
    ) : (
      <FaEye size={14} className="text-sky-700" />
    );
  };

  return (
    <li className="mb-2">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between rounded p-2 text-gray-900 hover:bg-gray-100 focus:outline-none dark:text-white dark:hover:bg-gray-600"
        onClick={() => onClick(folder.id)}>
        {/* Left side: Icon and folder info */}
        <div className="flex min-w-0 flex-1 items-center space-x-2">
          <FaFolder className="text-primary shrink-0 dark:text-green-400" size={16} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-left text-sm font-medium text-gray-900 dark:text-white">{folder.name}</div>
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <FaUser size={10} />
              <span className="max-w-[120px] truncate text-left">{folder.sharedFrom}</span>
            </div>
          </div>
        </div>

        {/* Right side: Permission and count */}
        <div className="ml-2 flex shrink-0 items-center space-x-2">
          <div className="flex items-center space-x-1">{getPermissionIcon()}</div>
          <span className="min-w-0 text-xs text-gray-500 dark:text-gray-400">{folder.promptCount}</span>
        </div>
      </button>
    </li>
  );
});

SharedFolderItemComponent.displayName = 'SharedFolderItem';

export default SharedFolderItemComponent;
