import { FaArrowRightLong } from 'react-icons/fa6';
import { IoReload } from 'react-icons/io5';
import { useState } from 'react';

const Header = ({
  goToDashboard,
  onReload,
  displayMode,
  toggleDisplayMode,
}: {
  goToDashboard: () => void;
  onReload: () => Promise<void>;
  displayMode: 'push' | 'overlay';
  toggleDisplayMode: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleReload = async () => {
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
      const minLoadingTime = 800;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      setTimeout(() => {
        setIsLoading(false);
      }, remainingTime);
    }
  };

  return (
    <header className="bg-primary p-4 text-white">
      <div className="flex w-full items-center">
        {/* Search Bar */}
        <div className="bg-primary-400 flex w-full items-center rounded-md px-4 py-2">
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
            placeholder="Search prompts..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex items-center justify-between sm:mt-0 md:mt-2">
        <button
          onClick={handleReload}
          disabled={isLoading}
          className={`group flex items-center text-sm text-white transition-all duration-200 ${
            isLoading ? 'cursor-not-allowed opacity-70' : 'hover:opacity-80'
          }`}
          title={isLoading ? 'reloading...' : 'Reload Prompts'}>
          <IoReload
            size={20}
            className={`transition-transform duration-200 ${isLoading ? 'animate-spin' : 'group-hover:rotate-45'}`}
            style={isLoading ? { animationDuration: '1s' } : {}}
          />
        </button>

        {/* Toggle Display Mode Button */}
        <button
          onClick={() => {
            console.log('切換模式:', displayMode);
            toggleDisplayMode();
          }}
          className="ml-4 flex items-center text-sm text-white hover:opacity-80 transition-all duration-200"
          title={`Switch to ${displayMode === 'push' ? 'overlay' : 'push'} mode`}>
          {displayMode === 'push' ? 'Overlay' : 'Push'}
        </button>

        <button onClick={goToDashboard} className="flex items-center text-sm text-white">
          To Dashboard
          <FaArrowRightLong className="ml-1 text-sm" />
        </button>
      </div>
    </header>
  );
};

export default Header;
