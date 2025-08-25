import React from 'react';
import FormMenuMultiSelect from '@src/components/renderers/FormMenuMultiSelect';

export function renderFormMenu(
  attrs: Record<string, string>,
  key: string,
  onChange?: React.ChangeEventHandler<HTMLSelectElement>,
) {
  const name = attrs.name;
  const defaultValue = Array.isArray(attrs.default)
    ? attrs.default
    : typeof attrs.default === 'string'
      ? attrs.default.split(',').map(v => v.trim())
      : [];

  // 處理 options（修正這邊）
  const options = Array.isArray(attrs.options)
    ? attrs.options
    : typeof attrs.options === 'string'
      ? attrs.options.split(',').map(v => v.trim())
      : [];

  const isMultiple =
    typeof attrs.multiple === 'string'
      ? ['true', 'yes', '1'].includes(attrs.multiple.toLowerCase())
      : Boolean(attrs.multiple);

  if (isMultiple) {
    // 建立一個適配器將 onChange 事件處理函式轉換為 FormMenuMultiSelect 期望的格式
    const handleMultiSelectChange = onChange
      ? (id: string, value: string[]) => {
          const syntheticEvent = {
            target: {
              id,
              value: value.join(','),
            },
          } as unknown as React.ChangeEvent<HTMLSelectElement>;
          onChange(syntheticEvent);
        }
      : undefined;

    return (
      <>
        <FormMenuMultiSelect
          key={key}
          customKey={key}
          name={name}
          defaultValue={defaultValue}
          options={options}
          onChange={handleMultiSelectChange}
          id={attrs.name ? `field_renderer_${attrs.name}_${key}` : `field_renderer_${key}`}
        />
        {/* 隱藏的 <select multiple> ，讓 generateFinalText  在 p  根據 type === 'select' 正確渲染 */}
        <select
          key={`${key}-hidden`}
          id={attrs.name ? `field_renderer_${attrs.name}_${key}` : `field_renderer_${key}`}
          multiple
          defaultValue={defaultValue}
          onChange={onChange}
          style={{ display: 'none' }}>
          {options.map((opt, i) => (
            <option key={`${opt}-${i}`} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </>
    );
  }

  return (
    <select
      key={key}
      id={attrs.name ? `field_renderer_${attrs.name}_${key}` : `field_renderer_${key}`}
      defaultValue={defaultValue[0] || ''}
      onChange={onChange}
      className="rounded border border-gray-400 bg-light px-2 py-1">
      {options.map((opt, i) => (
        <option key={`${opt}-${i}`} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
