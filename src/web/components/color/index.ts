import { WORKSPACE_COLORS } from '@/lib/consts.js';
import { div, h } from '@/lib/dom.js';
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
    el.addEventListener('click', () => pick(color));
    return el;
  });

  const setSelection = (color: HexColor) => {
    colorOptions.forEach((c) => c.classList.toggle('selected', color === c.dataset.color));
    palette.style.setProperty('--palette-value', color);
  };

  // Create the main circular color picker
  const picker = createPicker(id, setSelection);
  palette.style.setProperty('--palette-value', '#ffffff');
  const el = div('color-selector', [palette, ...colorOptions, picker.el]);

  // # register events

  const pick = (color: HexColor) => {
    setSelection(color);
    picker.setter(color);
  };

  const closePicker = popOut(picker.el, undefined, () => (picker.el.style.display = 'none'));

  picker.el.addEventListener('click', (e) => e.target === picker.el && closePicker());

  palette.addEventListener(
    'click',
    popIn(picker.el, () => (picker.el.style.display = 'grid'))
  );

  Object.defineProperty(el, 'value', {
    get: picker.getter,
    set: pick,
  });

  return el as HTMLColorSelectorElement;
};
