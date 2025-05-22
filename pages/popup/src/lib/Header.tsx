import React from 'react';

const Header = ({ goToDashboard }: { goToDashboard: () => void }) => {
  return (
    <header className="fixed left-0 top-0 z-10 flex w-full items-center justify-between bg-slate-700 px-6 py-4 text-white">
      {/* Search Bar */}
      <div className="flex items-center rounded-md bg-slate-500 px-4 py-2">
        Quick Prompts with shortcuts
        {/* <svg
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
        /> */}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-6">
        {/* New Prompt Button */}
        <button className="flex items-center space-x-2 rounded-md bg-slate-600 px-4 py-2 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>New prompt</span>
        </button>

        {/* Go to Dashboard Link */}
        <button onClick={goToDashboard} className="flex items-center font-medium text-white">
          Go to Dashboard
          <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 size-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10.293 14.707a1 1 0 010-1.414L13.586 10 10.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
            <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
