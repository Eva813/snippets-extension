import { memo } from 'react';
import { FaUsers } from 'react-icons/fa';
import { useSharedFoldersCount } from '../hooks/useSharedFolders';

interface SharedWithMeIndicatorProps {
  onClick: () => void;
}

const SharedWithMeIndicator = memo<SharedWithMeIndicatorProps>(({ onClick }) => {
  const { count, loading } = useSharedFoldersCount();

  return (
    <div className="bg-primary-400 rounded-lg p-1">
      <div className="group relative">
        <button
          disabled
          className="flex cursor-not-allowed items-center justify-center rounded-md p-1 text-base text-slate-300 opacity-50"
          title="Coming soon">
          <div className="relative">
            <FaUsers size={16} />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-slate-500 text-xs font-bold text-white">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </div>
        </button>

        <span className="absolute left-1/2 top-full z-[60] mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          {loading ? 'Loading shared folders...' : `Shared with Me${count > 0 ? ` (${count})` : ''}`}
        </span>
      </div>
    </div>
  );
});

SharedWithMeIndicator.displayName = 'SharedWithMeIndicator';

export default SharedWithMeIndicator;
