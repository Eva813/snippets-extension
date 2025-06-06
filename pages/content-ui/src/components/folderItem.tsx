import { FaCaretDown, FaCaretRight, FaArrowAltCircleDown } from 'react-icons/fa';
import type { Prompt, Folder } from '../types';
import { FaFolder } from 'react-icons/fa6';
interface FolderItemProps {
  folder: Folder;
  isCollapsed: boolean;
  toggleCollapse: (id: string) => void;
  hoveredPromptId: string | null;
  setHoveredPromptId: (id: string | null) => void;
  insertPrompt: (id: string, event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function FolderItem({
  folder,
  isCollapsed,
  toggleCollapse,
  hoveredPromptId,
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
      <div className="flex w-full items-center justify-between rounded px-2 py-1 hover:bg-gray-100 dark:hover:text-black">
        <strong className="flex cursor-pointer items-center text-lg">
          <FaFolder className="mr-2" size={18} />
          <span className="max-w-[180px] truncate">{folder.name}</span>
        </strong>
        <button
          onClick={() => toggleCollapse(folder.id)}
          className="rounded p-1 hover:bg-gray-200 focus:outline-none dark:hover:bg-gray-800">
          {isCollapsed ? <FaCaretRight size={16} /> : <FaCaretDown size={16} />}
        </button>
      </div>

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
                <div className="flex w-full items-center justify-between rounded px-2 py-1 hover:bg-gray-100 dark:hover:text-black">
                  <span className="max-w-[160px] truncate">{prompt.name}</span>
                  <div className="relative ml-4 mr-auto inline-block">
                    <button
                      className={`flex items-center justify-center transition-opacity duration-200 ${
                        hoveredPromptId === prompt.id ? 'visible opacity-100' : 'invisible opacity-0'
                      }`}
                      onMouseDown={e => handlePromptInsert(prompt.id, e)}>
                      <FaArrowAltCircleDown size={20} className="text-primary" />
                    </button>
                  </div>
                  <span className="inline-flex h-6 items-center rounded-full border border-blue-300 px-3 py-1 text-sm font-medium">
                    {prompt.shortcut}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </li>
  );
}
