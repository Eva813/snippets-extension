import { memo } from 'react';
import { FaUsers } from 'react-icons/fa';
import { useSharedFoldersCount } from '../hooks/useSharedFolders';

interface SharedWithMeIndicatorProps {
  onClick: () => void;
}

const SharedWithMeIndicator = memo<SharedWithMeIndicatorProps>(({ onClick }) => {
  const { count, loading } = useSharedFoldersCount();

  return (
    <div className="rounded-lg bg-primary-400 p-1">
      <div className="group relative">
        <button
          onClick={onClick}
          disabled={loading}
          className={`flex items-center justify-center rounded-md p-1 text-base text-slate-300 transition-all duration-200 hover:bg-slate-600/50 hover:text-white hover:opacity-80 ${
            loading ? 'cursor-not-allowed opacity-70' : ''
          }`}
          title={loading ? 'Loading shared folders...' : 'View Shared Folders'}>
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
