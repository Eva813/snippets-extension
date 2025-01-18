import '@src/Popup.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import type { ComponentPropsWithoutRef } from 'react';

const notificationOptions = {
  type: 'basic',
  iconUrl: chrome.runtime.getURL('icon-34.png'),
  title: 'Injecting content script error',
  message: 'You cannot inject script here!',
} as const;

const Popup = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';

  const goToDashboard = () => chrome.tabs.create({ url: 'https://chatgpt.com/' });

  const logo = isLight ? 'popup/logo_vertical.svg' : 'popup/logo_vertical_dark.svg';

  return (
    <div className="flex w-full items-center justify-between bg-red-500 px-6 py-4">
      {/* Search Bar */}
      <div className="flex items-center rounded-md bg-red-400 px-4 py-2">
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
          placeholder="Search snippets..."
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-6">
        {/* New Snippet Button */}
        <button className="flex items-center space-x-2 rounded-md bg-red-600 px-4 py-2 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>New snippet</span>
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
    </div>
  );
};

const ToggleButton = (props: ComponentPropsWithoutRef<'button'>) => {
  const theme = useStorage(exampleThemeStorage);
  return (
    <button
      className={
        props.className +
        ' ' +
        'font-bold mt-4 py-1 px-4 rounded shadow hover:scale-105 ' +
        (theme === 'light' ? 'bg-white text-black shadow-black' : 'bg-black text-white')
      }
      onClick={exampleThemeStorage.toggle}>
      {props.children}
    </button>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
