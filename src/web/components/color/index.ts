import { WORKSPACE_COLORS } from '@/lib/consts.js';
import { div } from '@/lib/dom.js';
import { popIn, popOut } from '../pop/index.js';
import { createPicker } from './picker.js';

type HTMLColorSelectorElement = HTMLDivElement & { value: HexColor };

/**
 * @param id The unique ID for the internal color picker input elements
 */
export default (id: string): HTMLColorSelectorElement => {
  const palette = div('color-option palette');
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

  const setOutlineColor = (color: HexColor) => {
    colorOptions.forEach((c) => c.classList.remove('selected'));
    palette.style.setProperty('--palette-value', color);
  };

  // Create the main circular color picker
  const picker = createPicker(id, setOutlineColor);
  palette.style.setProperty('--palette-value', '#ffffff');
  const el = div('color-selector', [palette, ...colorOptions, picker.el]);

  // # register events

  const pick = (color: HexColor) => {
    setOutlineColor(color);
    picker.setter(color);
  };

  const close = (e: PointerEvent) => {
    const node = e.target as Node;
    console.log('closePicker', node);
    e.stopPropagation();
    if (palette.contains(node) || picker.el.contains(node)) {
      return;
    }
    closePicker();
  };
  const closePicker = popOut(picker.el, undefined, () => (picker.el.style.display = 'none'));

  document.removeEventListener('click', close);
  document.addEventListener('click', close);
  palette.addEventListener(
    'click',
    popIn(picker.el, () => (picker.el.style.display = 'grid'))
  );

  Object.defineProperty(el, 'value', {
    get: picker.getter,
    set: picker.setter,
  });

  return el as HTMLColorSelectorElement;
};
