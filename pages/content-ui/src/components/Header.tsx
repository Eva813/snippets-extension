import { FaArrowRightLong } from 'react-icons/fa6';
import { IoReload } from 'react-icons/io5';
import { GoSidebarCollapse } from 'react-icons/go';
import { useState, useCallback, useEffect, useRef, memo } from 'react';
import SharedWithMeIndicator from './sharedWithMeIndicator';

interface HeaderProps {
  goToDashboard: () => void;
  onReload: () => Promise<void>;
  displayMode: 'push' | 'overlay';
  toggleDisplayMode: () => void;
  onSearchChange: (query: string) => void;
  onSharedWithMeClick: () => void;
}

const Header = memo<HeaderProps>(
  ({ goToDashboard, onReload, displayMode, toggleDisplayMode, onSearchChange, onSharedWithMeClick }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    // Constants
    const MIN_LOADING_TIME = 1000;
    const SEARCH_DEBOUNCE_DELAY = 300;

    const handleReload = useCallback(async () => {
      if (isLoading) return;

      setIsLoading(true);
      const startTime = Date.now();

      try {
        await onReload();
        console.log('Folders reloaded successfully');
      } catch (error) {
        console.error('Error reloading folders:', error);
      } finally {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      }
    }, [isLoading, onReload]);

    // Cleanup timeouts on unmount
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, []);

    // Memoized button className calculation
    const getDisplayModeButtonClassName = useCallback((mode: 'push' | 'overlay', isActive: boolean) => {
      const baseClasses = 'flex items-center justify-center rounded-md p-1 text-base transition-all duration-200';

      if (isActive) {
        return `${baseClasses} cursor-not-allowed text-white opacity-80`;
      }

      return `${baseClasses} text-gray-300 hover:bg-slate-600/50 hover:text-white hover:opacity-80`;
    }, []);

    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchValue(value);

        // Clear previous search timeout
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }

        // Set new debounced search
        searchTimeoutRef.current = setTimeout(() => {
          onSearchChange(value.trim());
        }, SEARCH_DEBOUNCE_DELAY);
      },
      [onSearchChange, SEARCH_DEBOUNCE_DELAY],
    );

    return (
      <header className="bg-primary px-4 py-2 text-white dark:bg-gray-800">
        <div className="flex w-full items-center">
          <div className="bg-third flex w-full items-center rounded-md px-4 py-2 dark:bg-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 size-5 text-white"
              viewBox="0 0 20 20"
              fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9 3a6 6 0 104.472 10.472l4.771 4.772a1 1 0 001.415-1.415l-4.772-4.771A6 6 0 009 3zM5 9a4 4 0 118 0 4 4 0 01-8 0z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder="Search prompts..."
              aria-label="Search prompts"
              role="searchbox"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white"
            />
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center justify-between sm:mt-0 md:mt-2">
          <div className="flex items-center space-x-2">
            <div className="bg-primary-400 rounded-lg p-1">
              <div className="group relative">
                <button
                  onClick={handleReload}
                  disabled={isLoading}
                  className={`flex items-center justify-center rounded-md p-1 text-base text-slate-300 transition-all duration-200 hover:bg-slate-600/50 hover:text-white  ${isLoading ? 'cursor-not-allowed opacity-70' : 'hover:opacity-80'}`}
                  title={isLoading ? 'reloading...' : 'Reload Prompts'}>
                  <IoReload
                    size={16}
                    className={`transition-transform duration-200 ${isLoading ? 'animate-spin' : 'hover:rotate-45'}`}
                    style={isLoading ? { animationDuration: '1s' } : {}}
                  />
                </button>

                <span className="absolute left-1/2 top-full z-[60] mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {isLoading ? 'reloading...' : 'Reload Prompts'}
                </span>
              </div>
            </div>

            {/* Shared with me Indicator */}
            <SharedWithMeIndicator onClick={onSharedWithMeClick} />

            {/* Display Mode Buttons - Grouped */}
            <div className="bg-primary-400 flex items-center space-x-2 rounded-lg p-1">
              <div className="group relative">
                <button
                  onClick={() => displayMode !== 'push' && toggleDisplayMode()}
                  disabled={displayMode === 'push'}
                  className={getDisplayModeButtonClassName('push', displayMode === 'push')}
                  title="push website to the side">
                  <GoSidebarCollapse size={17} />
                </button>

                <span className="absolute left-1/2 top-full z-[60] mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  push website to the side
                </span>
              </div>

              <div className="group relative">
                <button
                  onClick={() => displayMode !== 'overlay' && toggleDisplayMode()}
                  disabled={displayMode === 'overlay'}
                  className={getDisplayModeButtonClassName('overlay', displayMode === 'overlay')}
                  title="overlay website">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0)">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M16 0C14.8954 0 14 0.895432 14 2V22C14 23.1046 14.8954 24 16 24H22C23.1046 24 24 23.1046 24 22V2C24 0.895431 23.1046 0 22 0H16Z"
                      />
                      <path d="M2 1H12V3L2 3V21H12V23H2C0.89543 23 0 22.1046 0 21V3C0 1.89543 0.89543 1 2 1Z" />
                      <path d="M5 5H12V7H6V11H12V13H5C4.44771 13 4 12.5523 4 12V6C4 5.44772 4.44772 5 5 5Z" />
                      <path d="M5 16H12V18H5C4.44772 18 4 17.5523 4 17C4 16.4477 4.44772 16 5 16Z" />
                    </g>
                    <defs>
                      <clipPath id="clip0">
                        <rect width="24" height="24" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </button>
                <span className="absolute left-1/2 top-full z-[60] mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  overlay website
                </span>
              </div>
            </div>
          </div>

          <button onClick={goToDashboard} className="flex items-center text-sm text-white">
            To Dashboard
            <FaArrowRightLong className="ml-1 text-sm" />
          </button>
        </div>
      </header>
    );
  },
);

Header.displayName = 'Header';

export default Header;
