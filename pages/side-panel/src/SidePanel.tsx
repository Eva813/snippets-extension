import '@src/SidePanel.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { Button } from '@extension/ui';

const SidePanel = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const logo = isLight ? 'side-panel/logo_vertical.svg' : 'side-panel/logo_vertical_dark.svg';
  const goGithubSite = () =>
    chrome.tabs.create({ url: 'https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite' });

  return (
    <div className={`absolute inset-0 h-full p-4 text-center ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      <header
        className={`flex h-full flex-col items-center justify-center ${isLight ? 'text-gray-900' : 'text-gray-100'}`}
        style={{ fontSize: 'calc(10px + 2vmin)' }}>
        <button onClick={goGithubSite}>
          <img src={chrome.runtime.getURL(logo)} className="mb-4 h-[50vmin]" alt="logo" />
        </button>
        <p>
          Edit <code>pages/side-panel/src/SidePanel.tsx</code>
        </p>
        <Button variant="primary" size="md" onClick={exampleThemeStorage.toggle}>
          Toggle theme
        </Button>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
