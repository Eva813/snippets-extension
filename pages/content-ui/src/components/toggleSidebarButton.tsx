import React from 'react';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';

interface ToggleSidebarButtonProps {
  alignment: 'left' | 'right';
  visible: boolean;
  onToggle: () => void;
}

const ToggleSidebarButton: React.FC<ToggleSidebarButtonProps> = ({ alignment, visible, onToggle }) => {
  const handleToggle = () => {
    // 呼叫原有的 onToggle 函式
    onToggle();
    console.log('onToggle');
  };
  return (
    <button
      data-testid="sidebar-toggle-btn"
      className={`toggle-sidebar-btn flex h-10 w-6 items-center justify-center bg-slate-700 ${
        alignment === 'left'
          ? 'rounded-r-md' // 右側圓角
          : 'rounded-l-md' // 左側圓角
      } ${alignment} ${visible ? 'visible' : ''}`}
      onClick={handleToggle}>
      <div className="relative">
        <div className="sidebar-tooltip">
          close side panel (<span className="shortcut-link">⌥W</span>)
        </div>
      </div>
      {alignment === 'left' ? <FaAngleLeft className="text-white" /> : <FaAngleRight className="text-white" />}{' '}
      {/* align left 使用 FaAngleLeft ; align right 使用 FaAngleRight */}
    </button>
  );
};

export default ToggleSidebarButton;
