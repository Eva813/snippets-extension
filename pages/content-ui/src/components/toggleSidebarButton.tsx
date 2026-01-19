import React from 'react';
import { FaAngleRight } from 'react-icons/fa6';

interface ToggleSidebarButtonProps {
  alignment: 'left' | 'right'; //  alignment 參數保留以備未來擴展，目前固定使用右側設定
  visible: boolean;
  onToggle: () => void;
}

const ToggleSidebarButton: React.FC<ToggleSidebarButtonProps> = ({ alignment, visible, onToggle }) => {
  const handleToggle = () => {
    // 呼叫 onToggle 函式
    onToggle();
  };
  const handleShortcutLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 發送訊息給背景腳本來處理導航
    chrome.runtime.sendMessage({ action: 'openShortcutsPage' });
  };
  return (
    <button
      data-testid="sidebar-toggle-btn"
      className={`toggle-sidebar-btn flex h-6 w-4 items-center justify-center ${alignment === 'left' ? 'rounded-r-md' : 'rounded-l-md'} bg-yellow-400 ${
        visible ? 'visible' : ''
      }`}
      onClick={handleToggle}>
      <div className="relative">
        <div className="sidebar-tooltip text-white">
          <span className="text-xs text-white">toggle sidebar</span>
          <a
            href="chrome://extensions/shortcuts"
            rel="noopener noreferrer"
            className="shortcut-link text-xs text-white hover:underline"
            onClick={handleShortcutLinkClick}>
            &nbsp;( ⌥E )
          </a>
        </div>
      </div>
      <FaAngleRight className="text-white" size={12} />
    </button>
  );
};

export default ToggleSidebarButton;
