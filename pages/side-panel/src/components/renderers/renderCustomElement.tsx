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

type SnippetAttribute = {
  name: string;
  value: string;
};

type Snippet = {
  attributes: SnippetAttribute[];
};

export function renderCustomElement(
  el: HTMLElement,
  key: string,
  onChange?: React.ChangeEventHandler<HTMLElement>,
  initFormData?: (id: string, value: string) => void,
): React.ReactNode {
  const type = el.getAttribute('data-type')?.toLowerCase();
  const snippet = el.getAttribute('data-snippet');
  if (!snippet || !type) return null;

  try {
    const parsed = JSON.parse(snippet) as Snippet;
    const attrs = parsed.attributes.reduce((acc: Record<string, string>, attr) => {
      acc[attr.name] = attr.value;
      return acc;
    }, {});

    // 如果 id 屬性不存在，生成唯一的 id
    if (!attrs.id) {
      attrs.id = `field_renderer_${key}`;
    }

    // 如果有預設值且提供了 initFormData 函式，則初始化表單資料
    if (attrs.default && initFormData) {
      const fieldId = `field_renderer_${attrs.name}` || `field_renderer_${key}`;
      initFormData(fieldId, attrs.default);
    }

    const renderer = typeToRenderer[type];
    return renderer ? renderer(attrs, key, onChange) : <span key={key}>[Unknown type: {type}]</span>;
  } catch (err) {
    return <span key={key}>[Invalid snippet: {(err as Error).message}]</span>;
  }
}
