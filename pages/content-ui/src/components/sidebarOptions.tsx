import React, { useState, useEffect, forwardRef } from 'react';
import { FaAlignLeft, FaAlignRight } from 'react-icons/fa';
import { GoSidebarCollapse } from 'react-icons/go';

interface SidebarOptionsProps {
  alignment: 'left' | 'right';
  displayMode: 'overlay' | 'push';
  toggleAlignment: () => void;
  toggleDisplayMode: () => void;
  panelRef: HTMLElement | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const SidebarOptions = forwardRef<HTMLDivElement, SidebarOptionsProps>(
  ({ alignment, displayMode, toggleAlignment, toggleDisplayMode, panelRef, onMouseEnter, onMouseLeave }, ref) => {
    const [position, setPosition] = useState<{ top: number; left: number | null; right: number | null }>({
      top: 0,
      left: null,
      right: null,
    });

    useEffect(() => {
      if (panelRef) {
        try {
          const rect = panelRef.getBoundingClientRect();
          // console.log('面板位置資訊:', rect);

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

          // console.log('計算得到的位置:', { top, left, alignment });
          setPosition({ top, left, right: null }); // 不使用 right 屬性
        } catch (error) {
          console.error('計算位置時發生錯誤:', error);
        }
      } else {
        console.warn('panelRef 不存在，無法計算位置');
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
            }`}
            title="align sidebar left">
            <FaAlignLeft size={14} />
          </button>
          <button
            onClick={() => alignment !== 'right' && toggleAlignment()}
            className={`flex w-full items-center justify-start gap-2 px-1 text-base ${
              alignment === 'right' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
            title="align sidebar right">
            <FaAlignRight size={14} />
          </button>
        </div>
        {/* 顯示模式按鈕 */}
        <div className="flex w-full gap-1">
          <button
            onClick={() => displayMode !== 'push' && toggleDisplayMode()}
            className={`flex w-full items-center justify-start gap-2 px-1 text-base ${
              displayMode === 'push' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
            title="push website to the side">
            <GoSidebarCollapse size={17} />
          </button>
          <button
            onClick={() => displayMode !== 'overlay' && toggleDisplayMode()}
            className={`flex w-full items-center justify-start gap-2 px-1 text-base ${
              displayMode === 'overlay' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
            title="overlay website">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              id="meteor-icon-kit__solid-sidebar-overlay"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_525_144)">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M16 0C14.8954 0 14 0.895432 14 2V22C14 23.1046 14.8954 24 16 24H22C23.1046 24 24 23.1046 24 22V2C24 0.895431 23.1046 0 22 0H16Z"
                  fill="currentColor"
                />
                <path
                  d="M2 1H12V3L2 3V21H12V23H2C0.89543 23 0 22.1046 0 21V3C0 1.89543 0.89543 1 2 1Z"
                  fill="currentColor"
                />
                <path
                  d="M5 5H12V7H6V11H12V13H5C4.44771 13 4 12.5523 4 12V6C4 5.44772 4.44772 5 5 5Z"
                  fill="currentColor"
                />
                <path d="M5 16H12V18H5C4.44772 18 4 17.5523 4 17C4 16.4477 4.44772 16 5 16Z" fill="currentColor" />
              </g>
              <defs>
                <clipPath id="clip0_525_144">
                  <rect width="23" height="23" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </button>
        </div>
      </div>
    );
  },
);

SidebarOptions.displayName = 'SidebarOptions';
export default SidebarOptions;
