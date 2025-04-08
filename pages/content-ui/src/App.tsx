import { useEffect } from 'react';
// import { Button } from '@extension/ui';
// import { useStorage } from '@extension/shared';

export default function App() {
  // const theme = useStorage(exampleThemeStorage);

  useEffect(() => {
    console.log('content ui loaded');
  }, []);

  return (
    <div>
      {/* <div className="flex gap-1 text-blue-500">
        Edit <strong className="text-blue-700">pages/content-ui/src/app.tsx</strong> and save to reload.
      </div>
      <Button theme={theme} onClick={exampleThemeStorage.toggle}>
        Toggle Theme
      </Button> */}
    </div>
  );
}
