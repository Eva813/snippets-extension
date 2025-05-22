import React from 'react';
import { FaArrowRightLong } from 'react-icons/fa6';

const Header = ({ goToDashboard }: { goToDashboard: () => void }) => {
  return (
    <header className="bg-primary p-4 text-white">
      {/* Search Bar */}
      <div className="bg-primary-400 flex items-center rounded-md px-4 py-2">
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

      {/* Action Buttons */}
      <div className="mt-4 flex items-center justify-end space-x-6 sm:mt-0 md:mt-2">
        {/* Go to Dashboard Link */}
        <button onClick={goToDashboard} className="flex items-center text-sm text-white">
          To Dashboard
          <FaArrowRightLong className="ml-1 text-sm" />
        </button>
      </div>
    </header>
  );
};

export default Header;
