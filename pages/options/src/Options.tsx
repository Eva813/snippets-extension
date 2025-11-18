import '@src/Options.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { Button } from '@extension/ui';

const Options = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const logo = isLight ? 'options/logo_horizontal.svg' : 'options/logo_horizontal_dark.svg';
  const goGithubSite = () =>
    chrome.tabs.create({ url: 'https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite' });

  return (
    <div
      className={`flex h-screen w-screen flex-col items-center justify-center ${isLight ? 'bg-slate-50 text-gray-900' : 'bg-gray-800 text-gray-100'}`}
      style={{ fontSize: 'calc(10px + 2vmin)' }}>
      <button onClick={goGithubSite}>
        <img src={chrome.runtime.getURL(logo)} className="pointer-events-none h-[40vmin]" alt="logo" />
      </button>
      <p>
        Edit <code>pages/options/src/Options.tsx</code>
      </p>
      <Button className="mt-4" onClick={exampleThemeStorage.toggle}>
        Toggle theme
      </Button>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Options, <div> Loading ... </div>), <div> Error Occur </div>);
