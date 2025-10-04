import { div, h } from '@/lib/dom.js';

export const radio = (name: string, value: string, label: string) =>
  div('radio', [
    h('input', { type: 'radio', name, value, id: `${name}-${value}` }),
    h('label', { for: `${name}-${value}` }, label),
  ]);

export const selectRadioValue = (el: HTMLElement, value: string) => {
  const radios = el.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>;
  for (let i = 0; i < radios.length; i++) {
    radios[i].checked = radios[i].value === value;
  }
};

export const getRadioValue = (el: HTMLElement, defaultValue: string = '') => {
  const radios = el.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>;
  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      return radios[i].value;
    }
  }
  return defaultValue;
};
