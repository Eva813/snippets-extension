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

  // const isMultiple = ["true", "yes", "1"].includes((attrs.multiple || "").toLowerCase());
  // const isMultiple = Boolean(multipleAttr) || multipleAttr === "true" || multipleAttr === "yes";
  const isMultiple =
    typeof attrs.multiple === 'string'
      ? ['true', 'yes', '1'].includes(attrs.multiple.toLowerCase())
      : Boolean(attrs.multiple);

  if (isMultiple) {
    return (
      <FormMenuMultiSelect
        key={key}
        customKey={key}
        name={name}
        defaultValue={defaultValue}
        options={options}
        id={`field_renderer_${attrs.name}` || `field_renderer_${key}`}
      />
    );
  }

  return (
    <select
      key={key}
      id={`field_renderer_${attrs.name}` || `field_renderer_${key}`}
      defaultValue={defaultValue[0] || ''}
      onChange={onChange}
      className="border border-gray-400 bg-light px-2 py-1 rounded">
      {options.map((opt, i) => (
        <option key={`${opt}-${i}`} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
