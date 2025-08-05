import { useState, useRef } from 'react';
import { IoChevronDown } from 'react-icons/io5';

interface PromptSpace {
  id: string;
  name: string;
  type: 'my' | 'shared';
  isReadOnly?: boolean;
  defaultSpace?: boolean;
}

interface PromptSpaceSelectorProps {
  selectedSpaceId: string;
  onSpaceChange: (spaceId: string) => void;
  onFetchData?: (spaceId: string) => void;
  spaces?: PromptSpace[];
}

const PromptSpaceSelector: React.FC<PromptSpaceSelectorProps> = ({
  selectedSpaceId,
  onSpaceChange,
  onFetchData,
  spaces = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedSpace = spaces.find(space => space.id === selectedSpaceId) ||
    spaces[0] || { id: 'loading', name: 'Loading...', type: 'my' as const };

  const handleSelect = (spaceId: string) => {
    onSpaceChange(spaceId);
    setIsOpen(false);
    onFetchData?.(spaceId);
  };

  const mySpaces = spaces.filter(space => space.type === 'my');
  const sharedSpaces = spaces.filter(space => space.type === 'shared');

  return (
    <div className="relative border-b bg-white p-3" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white p-2 text-left text-sm text-gray-700 hover:border-gray-400">
        <span className="font-medium">{selectedSpace.name}</span>
        <IoChevronDown className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 max-h-[200px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {mySpaces.length > 0 && (
            <div>
              <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500">My Workspaces</div>
              {mySpaces.map(space => (
                <button
                  key={space.id}
                  onMouseDown={e => {
                    e.preventDefault();
                    handleSelect(space.id);
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm  hover:bg-gray-100 ${
                    selectedSpaceId === space.id ? 'text-primary bg-light font-bold' : 'text-gray-900'
                  }`}>
                  {space.name}
                </button>
              ))}
            </div>
          )}

          {sharedSpaces.length > 0 && (
            <div className={mySpaces.length > 0 ? 'border-t border-gray-100' : ''}>
              <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500">Shared with Me</div>
              {sharedSpaces.map(space => (
                <button
                  key={space.id}
                  onMouseDown={e => {
                    e.preventDefault();
                    handleSelect(space.id);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                    selectedSpaceId === space.id ? 'text-primary bg-light font-bold' : 'text-gray-900'
                  }`}>
                  <span>{space.name}</span>
                  {space.isReadOnly && <span className="text-xs text-gray-400">view only</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptSpaceSelector;
