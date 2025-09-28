import { WORKSPACE_COLORS } from '@/lib/consts.js';
import { div, h } from '@/lib/dom.js';

type HTMLColorSelectorElement = HTMLDivElement & { value: HexColor };

export default (id: string): HTMLColorSelectorElement => {
  // Create the main circular color picker
  const inputColor = h('input', { id, type: 'color', class: 'palette' });
  const palette = div('color-option palette', [inputColor]);
  palette.style.setProperty('--pallete-value', '#ffffff');

  const colorOptions: HTMLElement[] = WORKSPACE_COLORS.map((color) => {
    const el = div('color-option');
    el.style.backgroundColor = color;
    el.dataset.color = color;
    el.addEventListener('click', () => {
      pick(color);
      el.classList.add('selected');
    });
    return el;
  });

  const el = div('color-selector', [palette, ...colorOptions]);

  // # register events
  const pick = (color: HexColor) => {
    colorOptions.forEach((c) => c.classList.remove('selected'));
    inputColor.value = color;
    palette.style.setProperty('--pallete-value', color);
  };
  palette.addEventListener('click', () => inputColor.click());
  inputColor.addEventListener('input', () => pick(inputColor.value as HexColor));

  Object.defineProperty(el, 'value', {
    get() {
      return inputColor.value;
    },
    set(color: HexColor) {
      console.log('sss', color);
      pick(color);
    },
  });

  return el as HTMLColorSelectorElement;
};
