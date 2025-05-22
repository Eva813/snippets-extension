import React from 'react';
import { renderFormText } from './types/formText';
import { renderFormMenu } from './types/formMenu';

const typeToRenderer: Record<
  string,
  (attrs: Record<string, string>, key: string, onChange?: React.ChangeEventHandler<HTMLElement>) => React.ReactNode
> = {
  formtext: renderFormText as (
    attrs: Record<string, string>,
    key: string,
    onChange?: React.ChangeEventHandler<HTMLElement>,
  ) => React.ReactNode,
  formmenu: renderFormMenu as (
    attrs: Record<string, string>,
    key: string,
    onChange?: React.ChangeEventHandler<HTMLElement>,
  ) => React.ReactNode,
};

type PromptAttribute = {
  name: string;
  value: string;
};

type Prompt = {
  attributes: PromptAttribute[];
};

export function renderCustomElement(
  el: HTMLElement,
  key: string,
  onChange?: React.ChangeEventHandler<HTMLElement>,
  initFormData?: (id: string, value: string) => void,
): React.ReactNode {
  const type = el.getAttribute('data-type')?.toLowerCase();
  const prompt = el.getAttribute('data-prompt');
  if (!prompt || !type) return null;

  try {
    const parsed = JSON.parse(prompt) as Prompt;
    const attrs = parsed.attributes.reduce((acc: Record<string, string>, attr) => {
      acc[attr.name] = attr.value;
      return acc;
    }, {});
    const fieldId = attrs.name ? `field_renderer_${attrs.name}_${key}` : `field_renderer_${key}`;
    // 如果 id 屬性不存在，生成唯一的 id
    attrs.id = attrs.id || fieldId;

    // 如果有預設值且提供了 initFormData 函式，則初始化表單資料
    if (attrs['default'] && initFormData) {
      initFormData(fieldId, attrs['default']);
    }

    const renderer = typeToRenderer[type];
    return renderer ? renderer(attrs, key, onChange) : <span key={key}>[Unknown type: {type}]</span>;
  } catch (err) {
    return (
      <span key={key} style={{ color: 'red' }}>
        [Rendering failed: Data format error]
      </span>
    );
  }
}
