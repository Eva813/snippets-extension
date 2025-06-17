import { FaArrowRightLong } from 'react-icons/fa6';
import { IoReload } from 'react-icons/io5';
import { useState } from 'react';

const Header = ({ goToDashboard, onReload }: { goToDashboard: () => void; onReload?: () => Promise<void> }) => {
  const [isLoading, setIsLoading] = useState(false);
  const handleReload = async () => {
    if (isLoading) return; // 防止重複點擊

    setIsLoading(true);
    try {
      if (onReload) {
        // 使用傳入的 onReload 函式直接更新 SidePanel 的 folders state
        await onReload();
        console.log('Folders reloaded successfully via onReload');
      } else {
        // 備用方案：使用原本的方式
        await new Promise(resolve => {
          chrome.runtime.sendMessage({ action: 'getFolders' }, response => {
            if (response?.success) {
              console.log('Folders reloaded successfully:', response.data);
            } else {
              console.error('Failed to reload folders:', response?.error);
            }
            resolve(response);
          });
        });
      }
    } catch (error) {
      console.error('Error reloading folders:', error);
    } finally {
      // 確保至少顯示 500ms 的載入動畫，讓使用者看到反饋
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
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
          className={`flex items-center text-sm text-white ${isLoading ? 'cursor-not-allowed opacity-70' : 'hover:opacity-80'}`}>
          <IoReload
            size={20}
            className={isLoading ? 'animate-spin' : ''}
            style={isLoading ? { animationDuration: '1s' } : {}}
          />
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
