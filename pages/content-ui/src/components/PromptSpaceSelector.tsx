import { useState, useEffect, useRef } from 'react';
import { IoChevronDown } from 'react-icons/io5';

interface PromptSpace {
  id: string;
  name: string;
  type: 'my' | 'shared';
  isReadOnly?: boolean;
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
  spaces = [
    { id: 'promptSpace-default', name: 'promptSpace-default', type: 'my' },
    { id: 'promptSpace-shared', name: 'promptSpace-default', type: 'shared', isReadOnly: true },
  ],
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedSpace = spaces.find(space => space.id === selectedSpaceId) || spaces[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSpaceSelect = (spaceId: string) => {
    onSpaceChange(spaceId);
    setIsDropdownOpen(false);

    // Trigger API data fetch if callback provided
    if (onFetchData) {
      onFetchData(spaceId);
    }
  };

  const mySpaces = spaces.filter(space => space.type === 'my');
  const sharedSpaces = spaces.filter(space => space.type === 'shared');

  return (
    <div className="relative border-b bg-white p-3">
      <div className="relative" ref={dropdownRef}>
        {/* Dropdown Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-left text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ pointerEvents: 'auto' }}>
          <span className="font-medium">{selectedSpace.name}</span>
          <IoChevronDown className={`size-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute inset-x-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
            {/* My Workspaces Section */}
            {mySpaces.length > 0 && (
              <div className="p-3">
                <div className="mb-2 text-sm text-gray-500">My Workspaces</div>
                {mySpaces.map(space => (
                  <button
                    key={space.id}
                    onClick={() => handleSpaceSelect(space.id)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-blue-200 ${
                      selectedSpaceId === space.id ? 'bg-blue-100 text-gray-800' : 'text-gray-800 hover:bg-gray-50'
                    }`}>
                    {space.name}
                  </button>
                ))}
              </div>
            )}

            {/* Shared with Me Section */}
            {sharedSpaces.length > 0 && (
              <div className={`p-3 ${mySpaces.length > 0 ? 'border-t border-gray-100' : ''}`}>
                <div className="mb-2 text-sm text-gray-500">Shared with Me</div>
                {sharedSpaces.map(space => (
                  <div
                    key={space.id}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                      selectedSpaceId === space.id ? 'bg-blue-100 text-gray-800' : 'text-gray-800 hover:bg-gray-50'
                    }`}>
                    <button onClick={() => handleSpaceSelect(space.id)} className="flex-1 text-left">
                      {space.name}
                    </button>
                    {space.isReadOnly && <span className="text-xs text-gray-400">view</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptSpaceSelector;
