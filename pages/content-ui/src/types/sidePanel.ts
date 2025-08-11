export interface Prompt {
  id: string;
  name: string;
  content: string;
  shortcut: string;
}

export interface Folder {
  id: string;
  name: string;
  description: string;
  prompts: Prompt[];
}

export interface PromptSpace {
  id: string;
  name: string;
  type: 'my' | 'shared';
  isReadOnly?: boolean;
  defaultSpace?: boolean;
}

export interface ApiPromptSpace {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  defaultSpace?: boolean;
}

export interface SharedSpace {
  space: ApiPromptSpace;
  permission: 'view' | 'edit';
  sharedBy: string;
  sharedAt: string;
}

export interface PromptSpacesApiResponse {
  success: boolean;
  data?: {
    ownedSpaces: ApiPromptSpace[];
    sharedSpaces: SharedSpace[];
  };
  error?: string;
}

export interface FoldersApiResponse {
  success: boolean;
  data?: Folder[];
  error?: string;
}

export interface SidePanelProps extends Record<string, unknown> {
  alignment: 'left' | 'right';
  visible: boolean;
  displayMode: 'overlay' | 'push';
  isInDOM: boolean;
  isAnimating: boolean;
  noAnimation: boolean;
  setIsInDOM: (value: boolean) => void;
  onToggle: () => void;
  toggleDisplayMode: () => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export interface LoadingStateProps {
  message?: string;
}

export interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export interface ContentAreaProps {
  folders: Folder[];
  isLoading: boolean;
  loadError: string | null;
  collapsedFolders: Set<string>;
  hoveredPromptId: string | null;
  searchQuery?: string;
  onToggleCollapse: (folderId: string) => void;
  onSetHoveredPromptId: React.Dispatch<React.SetStateAction<string | null>>;
  onInsertPrompt: (id: string, event: React.MouseEvent) => void;
  onRetry: () => void;
}
