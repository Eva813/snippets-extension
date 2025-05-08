import type { Dispatch, SetStateAction } from 'react';
import type { Folder } from '../types';
import FolderItem from './folderItem';

interface FolderListProps {
  folders: Folder[];
  collapsedFolders: Set<string>;
  toggleCollapse: (folderId: string) => void;
  hoveredSnippetId: string | null;
  setHoveredSnippetId: Dispatch<SetStateAction<string | null>>;
  insertPrompt: (folderId: string) => void;
}

export default function FolderList({
  folders,
  collapsedFolders,
  toggleCollapse,
  hoveredSnippetId,
  setHoveredSnippetId,
  insertPrompt,
}: FolderListProps) {
  return (
    <ul className="text-black">
      {Array.isArray(folders)
        ? folders.map((folder: Folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              isCollapsed={collapsedFolders.has(folder.id)}
              toggleCollapse={toggleCollapse}
              hoveredSnippetId={hoveredSnippetId}
              setHoveredSnippetId={setHoveredSnippetId}
              insertPrompt={insertPrompt}
            />
          ))
        : null}
    </ul>
  );
}
