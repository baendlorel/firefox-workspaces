import { WORKSPACE_COLORS } from '@/lib/consts.js';
import { div, getTextColor, h } from '@/lib/dom.js';
import { popIn, popOut } from './pop/index.js';

type HTMLColorSelectorElement = HTMLDivElement & { value: HexColor };

const realPicker = () => {
  const indicator = h('input', 'palette-indicator');
  const picker = div('palette-picker');
  const alpha = div('palette-alpha');
  const hue = div('palette-hue');

  // Create indicators for current position
  const pickerIndicator = div('picker-indicator');
  const alphaIndicator = div('alpha-indicator');
  const hueIndicator = div('hue-indicator');

  picker.appendChild(pickerIndicator);
  alpha.appendChild(alphaIndicator);
  hue.appendChild(hueIndicator);

  const container = div({ class: 'palette-container', style: 'display:none' }, [
    indicator,
    picker,
    alpha,
    hue,
  ]);

  // Color state
  let currentHue = 0; // 0-360
  let currentSaturation = 1; // 0-1
  let currentValue = 1; // 0-1 (brightness)
  let currentAlpha = 1; // 0-1

  // Convert HSV to RGB
  const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r: number, g: number, b: number;

    if (h >= 0 && h < 60) {
      [r, g, b] = [c, x, 0];
    } else if (h >= 60 && h < 120) {
      [r, g, b] = [x, c, 0];
    } else if (h >= 120 && h < 180) {
      [r, g, b] = [0, c, x];
    } else if (h >= 180 && h < 240) {
      [r, g, b] = [0, x, c];
    } else if (h >= 240 && h < 300) {
      [r, g, b] = [x, 0, c];
    } else {
      [r, g, b] = [c, 0, x];
    }

    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  };

  // Convert RGB to Hex
  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  };

  // Convert RGBA to Hex with alpha
  const rgbaToHex = (r: number, g: number, b: number, a: number): string => {
    const hex = rgbToHex(r, g, b);
    if (a < 1) {
      const alphaHex = Math.round(a * 255)
        .toString(16)
        .padStart(2, '0');
      return hex + alphaHex;
    }
    return hex;
  };

  // Update picker background based on current hue
  const updatePickerBackground = () => {
    const [r, g, b] = hsvToRgb(currentHue, 1, 1);
    const hueColor = rgbToHex(r, g, b);
    // Create the correct gradient: white to hue horizontally, transparent to black vertically
    picker.style.background = `
      linear-gradient(to bottom, transparent, black),
      linear-gradient(to right, white, ${hueColor})
    `;
  };

  // Update alpha background based on current color
  const updateAlphaBackground = () => {
    const [r, g, b] = hsvToRgb(currentHue, currentSaturation, currentValue);
    const color = rgbToHex(r, g, b);
    alpha.style.background = `
      linear-gradient(to bottom, ${color} 0%, transparent 100%),
      repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px
    `;
  };

  // Update indicator color and position indicators
  const updateIndicator = () => {
    const [r, g, b] = hsvToRgb(currentHue, currentSaturation, currentValue);
    const color = rgbaToHex(r, g, b, currentAlpha);

    indicator.value = color.toUpperCase();
    indicator.style.backgroundColor = rgbToHex(r, g, b);
    indicator.style.color = getTextColor(rgbToHex(r, g, b));
    indicator.style.opacity = currentAlpha.toString();

    // Update alpha background based on current color
    updateAlphaBackground();

    // Update position indicators
    const pickerRect = picker.getBoundingClientRect();
    const alphaRect = alpha.getBoundingClientRect();
    const hueRect = hue.getBoundingClientRect();

    if (pickerRect.width > 0 && pickerRect.height > 0) {
      // Picker indicator position (saturation = x, value = y inverted)
      pickerIndicator.style.left = `${currentSaturation * pickerRect.width}px`;
      pickerIndicator.style.top = `${(1 - currentValue) * pickerRect.height}px`;
    }

    if (alphaRect.height > 0) {
      // Alpha indicator position
      alphaIndicator.style.top = `${(1 - currentAlpha) * alphaRect.height}px`;
    }

    if (hueRect.height > 0) {
      // Hue indicator position
      hueIndicator.style.top = `${(currentHue / 360) * hueRect.height}px`;
    }
  };

  // Initialize picker background
  updatePickerBackground();
  updateAlphaBackground();

  // Show indicators when container is visible
  const observer = new MutationObserver((mutations) =>
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const isVisible = container.style.display !== 'none';
        container.dataset.visible = isVisible.toString();
        if (isVisible) {
          // Delay to ensure DOM is ready
          setTimeout(updateIndicator, 50);
        }
      }
    })
  );

  observer.observe(container, { attributes: true, attributeFilter: ['style'] });

  let isDragging = false;
  let currentTarget: HTMLElement | null = null;

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !currentTarget) return;

    const rect = currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (currentTarget === picker) {
      currentSaturation = x;
      currentValue = 1 - y; // Invert Y for brightness
    } else if (currentTarget === alpha) {
      currentAlpha = 1 - y; // Invert Y so top is 100%
    } else if (currentTarget === hue) {
      currentHue = y * 360;
      updatePickerBackground();
    }

    updateIndicator();
  };

  const handleMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target === picker || target === alpha || target === hue) {
      isDragging = true;
      currentTarget = target;
      handleMouseMove(e); // Update immediately
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      e.preventDefault();
    }
  };

  const handleMouseUp = () => {
    isDragging = false;
    currentTarget = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Add event listeners
  picker.addEventListener('mousedown', handleMouseDown);
  alpha.addEventListener('mousedown', handleMouseDown);
  hue.addEventListener('mousedown', handleMouseDown);

  // Allow direct editing of indicator input
  indicator.addEventListener('input', (e) => {
    const value = (e.target as HTMLInputElement).value;
    if (/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(value)) {
      // Parse hex color
      const hex = value.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      const a = hex.length > 6 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;

      // Convert RGB to HSV
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;

      // Hue
      let h = 0;
      if (delta !== 0) {
        if (max === r) h = 60 * (((g - b) / delta) % 6);
        else if (max === g) h = 60 * ((b - r) / delta + 2);
        else h = 60 * ((r - g) / delta + 4);
      }
      if (h < 0) h += 360;

      // Saturation
      const s = max === 0 ? 0 : delta / max;

      // Value
      const v = max;

      currentHue = h;
      currentSaturation = s;
      currentValue = v;
      currentAlpha = a;

      updatePickerBackground();
      updateIndicator();
    }
  });

  // Initialize
  updateIndicator();

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
