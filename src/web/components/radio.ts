import { div, h } from '@/lib/dom.js';

export const radio = (name: string, value: string, label: string) =>
  div('radio', [
    h('input', { type: 'radio', name, value, id: `${name}-${value}` }),
    h('label', { for: `${name}-${value}` }, label),
  ]);

export const selectRadioValue = (el: HTMLElement, value: string) => {
  const len = el.children.length;
  for (let i = 0; i < len; i++) {
    const c = el.children[i];
    if (c instanceof HTMLInputElement && c.type === 'radio') {
      c.checked = c.value === value;
    }
  }
};

export const getRadioValue = (el: HTMLElement, defaultValue: string = '') => {
  const len = el.children.length;
  for (let i = 0; i < len; i++) {
    const c = el.children[i];
    if (c instanceof HTMLInputElement && c.type === 'radio' && c.checked) {
      return c.value;
    }
  }
  return defaultValue;
};
