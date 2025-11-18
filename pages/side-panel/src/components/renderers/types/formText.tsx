import React from 'react';

export function renderFormText(
  attrs: Record<string, string>,
  key: string,
  onChange?: React.ChangeEventHandler<HTMLInputElement>,
) {
  return (
    <input
      key={key}
      id={attrs.name ? `field_renderer_${attrs.name}_${key}` : `field_renderer_${key}`}
      placeholder={attrs.name || 'Label'}
      defaultValue={attrs.default || ''}
      className="bg-light rounded border border-gray-400 px-2 py-1"
      onChange={onChange}
    />
  );
}
