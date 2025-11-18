import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    console.log('runtime content view loaded');
  }, []);

  return <div className="text-xl">runtime content view</div>;
}
