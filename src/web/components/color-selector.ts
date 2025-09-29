import { WORKSPACE_COLORS } from '@/lib/consts.js';
import { div, getTextColor, h } from '@/lib/dom.js';
import { popIn, popOut } from './pop/index.js';

type HTMLColorSelectorElement = HTMLDivElement & { value: HexColor };

const realPicker = () => {
  const indicator = h('input', 'palette-indicator');
  const picker = div('palette-picker');
  const alpha = div('palette-alpha');
  const hue = div('palette-hue');

  const container = div({ class: 'palette-container', style: 'display:none' }, [
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

  return { container, indicator, picker, alpha, hue };
};

export default (): HTMLColorSelectorElement => {
  // Create the main circular color picker
  const inputColor = h('input', { type: 'color', class: 'palette' });
  const { container: picker, indicator } = realPicker();
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
    indicator.value = color.toUpperCase();
    indicator.style.backgroundColor = color;
    indicator.style.color = getTextColor(color);
  };

  const close = (e: PointerEvent) => {
    const node = e.target as Node;
    console.log('closePicker', node);
    e.stopPropagation();
    if (palette.contains(node) || picker.contains(node)) {
      return;
    }
    closePicker();
  };
  const closePicker = popOut(picker, undefined, () => (picker.style.display = 'none'));

  document.removeEventListener('click', close);
  document.addEventListener('click', close);
  palette.addEventListener(
    'click',
    popIn(picker, () => (picker.style.display = 'grid'))
  );
  inputColor.addEventListener('input', () => pick(inputColor.value as HexColor));

  Object.defineProperty(el, 'value', {
    get() {
      return inputColor.value;
    },
    set: pick,
  });

  return el as HTMLColorSelectorElement;
};
