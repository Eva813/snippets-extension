import React from 'react';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';

interface ToggleSidebarButtonProps {
  alignment: 'left' | 'right';
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
      className={`toggle-sidebar-btn bg-primary flex h-8 w-5 items-center justify-center ${
        alignment === 'left'
          ? 'rounded-r-md' // 右側圓角
          : 'rounded-l-md' // 左側圓角
      } ${alignment} ${visible ? 'visible' : ''}`}
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
      {alignment === 'left' ? <FaAngleLeft className="text-white" /> : <FaAngleRight className="text-white" />}{' '}
    </button>
  );
};

export default ToggleSidebarButton;
