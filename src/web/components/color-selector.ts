import { WORKSPACE_COLORS } from '@/lib/consts.js';
import { div, h } from '@/lib/dom.js';

type HTMLColorSelectorElement = HTMLDivElement & { value: HexColor };

const realPicker = () => {
  const indicator = div('palette-indicator');
  const picker = div('palette-picker');
  const alpha = div('palette-alpha');
  const hue = div('palette-hue');

  const el = div({ class: 'palette-container', style: 'display:none' }, [
    indicator,
    picker,
    alpha,
    hue,
  ]);

  const mousemove = (e: MouseEvent) => {};

  const mousedown = (e: MouseEvent) => {
    document.addEventListener('mousemove', mousemove);
  };

  const mouseup = (e: MouseEvent) => {
    document.removeEventListener('mousemove', mousemove);
  };

  return el;
};

export default (id: string): HTMLColorSelectorElement => {
  // Create the main circular color picker
  const inputColor = h('input', { id, type: 'color', class: 'palette' });
  const picker = realPicker();
  const palette = div('color-option palette', [inputColor]);
  palette.style.setProperty('--palette-value', '#ffffff');

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

  const el = div('color-selector', [palette, ...colorOptions, picker]);

  // # register events
  const pick = (color: HexColor) => {
    colorOptions.forEach((c) => c.classList.remove('selected'));
    inputColor.value = color;
    palette.style.setProperty('--palette-value', color);
  };
  const closePicker = (e: PointerEvent) => {
    const node = e.target as Node;
    console.log('closePicker', node);
    e.stopPropagation();
    if (palette.contains(node) || picker.contains(node)) {
      return;
    }
    picker.style.display = 'none';
  };

  document.removeEventListener('click', closePicker);
  document.addEventListener('click', closePicker);
  palette.addEventListener('click', () => (picker.style.display = 'block'));
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
