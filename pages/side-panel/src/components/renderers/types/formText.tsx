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
      className="rounded border border-gray-500 bg-gray-600 px-2 py-1 text-white placeholder:text-gray-400 focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
      onChange={onChange}
    />
  );
}
