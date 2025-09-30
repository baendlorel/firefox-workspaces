import './style.css';
import { WORKSPACE_COLORS } from '@/lib/consts.js';
import { div } from '@/lib/dom.js';
import { popIn } from '../pop/index.js';
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

  palette.addEventListener(
    'click',
    popIn(picker.el, () => {
      const rect = palette.getBoundingClientRect();
      picker.showModal(rect.x + 30, rect.y - 15);
    })
  );

  Object.defineProperty(el, 'value', {
    get: picker.getter,
    set: pick,
  });

  return el as HTMLColorSelectorElement;
};
