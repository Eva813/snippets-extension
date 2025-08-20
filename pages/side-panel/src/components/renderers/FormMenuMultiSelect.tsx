'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown } from 'react-icons/fi';

interface FormMenuMultiSelectProps {
  options: string[];
  defaultValue: string[];
  name?: string;
  customKey: string;
  id?: string;
  onChange?: (id: string, value: string[]) => void;
}

const FormMenuMultiSelect: React.FC<FormMenuMultiSelectProps> = ({
  options,
  defaultValue,
  name,
  customKey,
  id,
  onChange,
}) => {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  const [open, setOpen] = useState<boolean>(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownId = id || `field_renderer_${name ?? 'auto'}_${customKey}`;

  // 定位 dropdown
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
        position: 'absolute',
        zIndex: 1000,
      });
    }
  }, [open]);

  // 點擊外部關閉 dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedOutsideTrigger = !triggerRef.current?.contains(target);
      const clickedOutsideDropdown = !dropdownRef.current?.contains(target);

      if (clickedOutsideTrigger && clickedOutsideDropdown) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const toggleOption = (opt: string) => {
    setSelected(prev => {
      const newSelection = prev.includes(opt) ? prev.filter(v => v !== opt) : [...prev, opt];
      if (onChange) {
        onChange(dropdownId, newSelection);
      }
      return newSelection;
    });
  };

  return (
    <>
      <span className="relative inline-block w-40 align-middle">
        <button
          ref={triggerRef}
          id={dropdownId}
          type="button"
          onClick={() => setOpen(!open)}
          className="relative w-40 rounded border border-gray-300 bg-light px-3 py-1 pr-8 text-left">
          <span className="block truncate">{selected.join(', ') || 'choose'}</span>
          <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
        </button>
      </span>

      {/* dropdown 渲染到 body 外 */}
      {open &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            id={id}
            className="max-h-60 overflow-auto rounded border bg-white p-2 shadow-md">
            {options.map((opt, i) => (
              <label
                key={`${opt}-${i}`}
                className="flex cursor-pointer items-center space-x-2 rounded px-2 py-1 hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                  className="accent-blue-500"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
};

export default FormMenuMultiSelect;
