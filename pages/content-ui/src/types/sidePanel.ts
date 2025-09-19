export interface Prompt {
  id: string;
  name: string;
  content: string; // HTML (向後相容)
  contentJSON?: unknown; // JSON (新格式) - 使用 unknown 避免複雜的型別導入
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

// === 共享文件夾相關類型定義 (基於後台 API) ===

export interface SharedFolderItem {
  id: string;
  name: string;
  description?: string;
  permission: 'view' | 'edit';
  shareType: 'space' | 'additional';
  promptCount: number;
  sharedFrom: string;
  shareEmail?: string;
}

export interface SharedFoldersResponse {
  folders: SharedFolderItem[];
  total: number;
}

export interface PromptItem {
  id: string;
  name: string;
  content: string;
  contentJSON: object | null;
  shortcut?: string;
}

export interface SharedFolderDetailResponse {
  id: string;
  name: string;
  description?: string;
  promptCount: number;
  sharedFrom: string;
  shareType: 'space' | 'additional' | 'public';
  permission: 'view' | 'edit';
  shareEmail?: string;
  prompts: PromptItem[];
}

export interface PublicFolderResponse {
  available: boolean;
  data?: {
    folder: {
      name: string;
      description: string;
    };
    prompts: PublicPromptItem[];
  };
  error?: {
    code: 'NOT_FOUND' | 'INACTIVE' | 'TEAM_ONLY' | 'FOLDER_DELETED';
    message: string;
    cta: {
      text: string;
      link: string;
    };
  };
}

export interface PublicPromptItem {
  id: string;
  name: string;
  content: string;
  contentJSON: object | null;
  shortcut?: string;
}
