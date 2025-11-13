import { FaCaretDown, FaCaretRight, FaArrowAltCircleDown } from 'react-icons/fa';
import type { Prompt, Folder } from '../types';
import { FaFolder } from 'react-icons/fa6';
import HighlightText from './highlightText';

interface FolderItemProps {
  folder: Folder;
  isCollapsed: boolean;
  toggleCollapse: (id: string) => void;
  hoveredPromptId: string | null;
  searchQuery?: string;
  setHoveredPromptId: (id: string | null) => void;
  insertPrompt: (id: string, event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function FolderItem({
  folder,
  isCollapsed,
  toggleCollapse,
  hoveredPromptId,
  searchQuery,
  setHoveredPromptId,
  insertPrompt,
}: FolderItemProps) {
  const handlePromptInsert = (promptId: string | undefined, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (promptId) {
      insertPrompt(promptId, e);
    }
  };
  return (
    <li className="mb-2">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between rounded px-2 py-1 hover:bg-gray-100 focus:outline-none dark:hover:text-black"
        onClick={() => toggleCollapse(folder.id)}>
        <strong className="flex items-center text-lg">
          <FaFolder className="mr-2" size={18} />
          <HighlightText text={folder.name} searchQuery={searchQuery || ''} className="max-w-[180px] truncate" />
        </strong>
        <div className="rounded p-1 hover:bg-gray-200 focus:outline-none dark:hover:bg-gray-800">
          {isCollapsed ? <FaCaretRight size={16} /> : <FaCaretDown size={16} />}
        </div>
      </button>

      {!isCollapsed && (
        <ul className="ml-4 mt-1">
          {folder.prompts.length === 0 ? (
            <span className="ml-2 text-gray-500">No prompts in the folder</span>
          ) : (
            folder.prompts.map((prompt: Prompt) => (
              <li
                key={prompt.id}
                className="mb-2"
                onMouseEnter={() => prompt.id && setHoveredPromptId(prompt.id)}
                onMouseLeave={() => setHoveredPromptId(null)}>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between rounded px-2 py-1 hover:bg-gray-100 focus:outline-none dark:hover:text-black"
                  onMouseDown={e => handlePromptInsert(prompt.id, e)}>
                  <HighlightText
                    text={prompt.name}
                    searchQuery={searchQuery || ''}
                    className="max-w-[160px] truncate"
                  />
                  <div className="relative ml-4 mr-auto inline-block">
                    <div
                      className={`flex items-center justify-center transition-opacity duration-200 ${
                        hoveredPromptId === prompt.id ? 'visible opacity-100' : 'invisible opacity-0'
                      }`}>
                      <FaArrowAltCircleDown size={20} className="text-primary" />
                    </div>
                  </div>
                  <span className="inline-flex h-6 max-w-[110px] items-center rounded-full border border-secondary px-3 py-1 text-sm font-medium">
                    <HighlightText text={prompt.shortcut} searchQuery={searchQuery || ''} className="block truncate" />
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </li>
  );
}
