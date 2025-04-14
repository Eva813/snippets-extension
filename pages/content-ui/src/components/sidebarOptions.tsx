import React, { useState, useEffect, forwardRef } from 'react';
import { FaAlignLeft, FaAlignRight } from 'react-icons/fa';

interface SidebarOptionsProps {
  alignment: 'left' | 'right';
  toggleAlignment: () => void;
  panelRef: HTMLElement | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const SidebarOptions = forwardRef<HTMLDivElement, SidebarOptionsProps>(
  ({ alignment, toggleAlignment, panelRef, onMouseEnter, onMouseLeave }, ref) => {
    const [position, setPosition] = useState<{ top: number; left: number | null; right: number | null }>({
      top: 0,
      left: null,
      right: null,
    });

    useEffect(() => {
      if (panelRef) {
        console.log('設定位置 - panelRef 存在');
        try {
          const rect = panelRef.getBoundingClientRect();
          console.log('面板位置資訊:', rect);

          // 計算垂直位置，將選項放在面板中間
          const top = rect.top;

          // 預估按鈕寬度
          const optionsWidth = 58;

          // 統一使用 left 屬性進行定位
          let left = null;

          if (alignment === 'left') {
            // 左側面板：選項放在面板右側
            left = rect.right;
          } else {
            // 右側面板：選項放在面板左側
            left = rect.left - optionsWidth;
          }

          console.log('計算得到的位置:', { top, left, alignment });
          setPosition({ top, left, right: null }); // 不使用 right 屬性
        } catch (error) {
          console.error('計算位置時發生錯誤:', error);
        }
      } else {
        console.log('panelRef 不存在，無法計算位置');
      }
    }, [panelRef, alignment]);

    // 如果沒有參考元素或不應該顯示，則不渲染
    // if (!panelRef || (!isVisible && !isAnimating)) return null;

    return (
      <div
        ref={ref}
        className={`sidebar-options-container bg-slate-700 p-2 ${
          alignment === 'left'
            ? 'rounded-r-md' // 右側圓角
            : 'rounded-l-md' // 左側圓角
        }`}
        style={{
          position: 'fixed', // 固定位置
          top: `${position.top}px`,
          left: position.left !== null ? `${position.left}px` : 'auto',
          right: position.right !== null ? `${position.right}px` : 'auto',
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}>
        <div className="flex w-full gap-1">
          <button
            onClick={() => alignment !== 'left' && toggleAlignment()}
            className={`flex w-full items-center justify-start gap-2 px-1 text-base ${
              alignment === 'left' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}>
            <FaAlignLeft className="text-xs" />
          </button>
          <button
            onClick={() => alignment !== 'right' && toggleAlignment()}
            className={`flex w-full items-center justify-start gap-2 px-1 text-base ${
              alignment === 'right' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}>
            <FaAlignRight className="text-xs" />
          </button>
        </div>
      </div>
    );
  },
);

SidebarOptions.displayName = 'SidebarOptions';
export default SidebarOptions;
