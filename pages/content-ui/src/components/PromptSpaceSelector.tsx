import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { IoChevronDown } from 'react-icons/io5';
import type { PromptSpace } from '../types/sidePanel';

// Constants
const LOADING_CONFIG = {
  ID: '__loading__',
  TEXT: 'Loading workspaces...',
} as const;

const SECTION_TITLES = {
  MY_WORKSPACES: 'My Workspaces',
  SHARED_WITH_ME: 'Shared with Me',
  VIEW_ONLY: 'view only',
} as const;

interface PromptSpaceSelectorProps {
  selectedSpaceId: string;
  onSpaceChange: (spaceId: string) => void;
  onFetchData?: (spaceId: string) => void;
  spaces?: PromptSpace[];
}

const PromptSpaceSelector = memo<PromptSpaceSelectorProps>(
  ({ selectedSpaceId, onSpaceChange, onFetchData, spaces = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 點擊外部關閉下拉選單
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }

      // 當 isOpen 為 false 時，不需要清理函式
      return undefined;
    }, [isOpen]);

    // 使用 useMemo 快取計算結果，避免每次渲染時重新計算
    const { mySpaces, sharedSpaces, selectedSpace } = useMemo(() => {
      const my = spaces.filter(space => space.type === 'my');
      const shared = spaces.filter(space => space.type === 'shared');

      // 改進的 selected space 邏輯
      let selected = spaces.find(space => space.id === selectedSpaceId);

      if (!selected) {
        if (spaces.length === 0) {
          // 沒有任何 spaces 時的 loading 狀態
          selected = { id: LOADING_CONFIG.ID, name: LOADING_CONFIG.TEXT, type: 'my' as const };
        } else {
          // 有 spaces 但沒找到選中的，使用第一個
          selected = spaces[0];
        }
      }

      return { mySpaces: my, sharedSpaces: shared, selectedSpace: selected };
    }, [spaces, selectedSpaceId]);

    const handleSelect = useCallback(
      (spaceId: string) => {
        onSpaceChange(spaceId);
        setIsOpen(false);
        onFetchData?.(spaceId);
      },
      [onSpaceChange, onFetchData],
    );

    return (
      <div
        className="dark:border-dark-elevated dark:bg-sidebar-content relative border-b border-gray-300 bg-white p-3"
        ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={`Select workspace, currently selected: ${selectedSpace.name}`}
          className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white p-2 text-left text-sm text-gray-700 hover:border-gray-400 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:hover:border-neutral-500">
          <span className="font-medium">{selectedSpace.name}</span>
          <IoChevronDown className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        {isOpen && (
          <div
            role="listbox"
            aria-label="Workspace options"
            className="absolute inset-x-0 top-full z-50 mt-1 max-h-[200px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-neutral-600 dark:bg-neutral-700">
            {mySpaces.length > 0 && (
              <div>
                <div className="dark:text-dark-text-secondary bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 dark:bg-neutral-700">
                  {SECTION_TITLES.MY_WORKSPACES}
                </div>
                {mySpaces.map(space => (
                  <button
                    key={space.id}
                    role="option"
                    aria-selected={selectedSpaceId === space.id}
                    onMouseDown={e => {
                      e.preventDefault();
                      handleSelect(space.id);
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-neutral-700 ${
                      selectedSpaceId === space.id
                        ? 'bg-light text-primary font-bold dark:bg-neutral-700 dark:text-yellow-400'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                    {space.name}
                  </button>
                ))}
              </div>
            )}

            {sharedSpaces.length > 0 && (
              <div className={mySpaces.length > 0 ? 'dark:border-dark-elevated border-t border-gray-100' : ''}>
                <div className="dark:text-dark-text-secondary bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 dark:bg-neutral-700">
                  {SECTION_TITLES.SHARED_WITH_ME}
                </div>
                {sharedSpaces.map(space => (
                  <button
                    key={space.id}
                    role="option"
                    aria-selected={selectedSpaceId === space.id}
                    onMouseDown={e => {
                      e.preventDefault();
                      handleSelect(space.id);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-neutral-700 ${
                      selectedSpaceId === space.id
                        ? 'bg-light text-primary font-bold dark:bg-neutral-700 dark:text-yellow-400'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                    <span>{space.name}</span>
                    {space.isReadOnly && (
                      <span className="dark:text-dark-text-secondary text-xs text-gray-400">
                        {SECTION_TITLES.VIEW_ONLY}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

PromptSpaceSelector.displayName = 'PromptSpaceSelector';

export default PromptSpaceSelector;
