import React from 'react';

export function renderFormText(
  attrs: Record<string, string>,
  key: string,
  onChange?: React.ChangeEventHandler<HTMLInputElement>,
) {
  return (
    <input
      key={key}
      id={`field_renderer_${attrs.name}` || `field_renderer_${key}`}
      placeholder={attrs.name || 'Label'}
      defaultValue={attrs.default || ''}
      className="bg-light rounded border border-gray-400 px-2 py-1"
      onChange={onChange}
    />
  );
}
