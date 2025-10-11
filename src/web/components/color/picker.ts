import { Color } from '@/lib/color.js';
import { h, div } from '@/lib/dom.js';
import { autoPopOutDialog } from '../pop/index.js';

// fixme 第一个选择器很大有36px
export const createPicker = (id: string, onChange: (color: HexColor) => void) => {
  const indicator = h('input', { id, class: 'palette-indicator' });
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

  const container = div('palette-container', [indicator, picker, alpha, hue]);
  const el = h('dialog', 'palette-dialog', [container]);
  el.close();

  // Color state
  let currentHue = 0; // 0-360
  let currentSaturation = 1; // 0-1
  let currentValue = 1; // 0-1 (brightness)
  let currentAlpha = 1; // 0-1

  // Update picker background based on current hue
  const updatePickerBackground = () => {
    const color = Color.create(currentHue, 1, 1);
    // Create the correct gradient: white to hue horizontally, transparent to black vertically
    picker.style.background = `
      linear-gradient(to bottom, transparent, black),
      linear-gradient(to right, white, ${color.toHex()})
    `;
  };

  // Update alpha background based on current color
  const updateAlphaBackground = () => {
    const color = Color.create(currentHue, currentSaturation, currentValue);
    alpha.style.background = `
      linear-gradient(to bottom, ${color.toHex()} 0%, transparent 100%),
      repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px
    `;
  };

  // Update indicator color and position indicators
  const updateIndicator = () => {
    const color = Color.create(currentHue, currentSaturation, currentValue, currentAlpha);
    const hexa = color.toHexa();
    indicator.value = hexa;
    indicator.style.backgroundColor = hexa;
    indicator.style.color = color.brightness > 128 ? 'var(--dark)' : 'var(--light)';

    onChange(hexa);

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

  const updateWithRgba = (value: string) => {
    // Parse hex color
    const color = Color.from(value);
    const { h, s, v, a } = color.toHsv();

    currentHue = h;
    currentSaturation = s;
    currentValue = v;
    currentAlpha = a;

    requestAnimationFrame(() => {
      // & When inputing '007acc' and last letter is alphabet, it will appear 2 of them at a press
      // & To avoid this we justify it in the next frame
      indicator.value = value;
    });

    updatePickerBackground();
    updateIndicator();
  };

  // Initialize picker background
  updatePickerBackground();
  updateAlphaBackground();

  // Show indicators when container is visible
  const observer = new MutationObserver((mutations) =>
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const isVisible = el.style.display !== 'none';
        el.dataset.visible = isVisible.toString();
        if (isVisible) {
          // Delay to ensure DOM is ready
          setTimeout(updateIndicator, 50);
        }
      }
    })
  );

  observer.observe(el, { attributes: true, attributeFilter: ['style'] });

  let isDragging = false;
  let currentTarget: HTMLElement | null = null;

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !currentTarget) {
      return;
    }

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
  indicator.addEventListener('input', () => {
    const value = indicator.value;
    if (Color.valid(value)) {
      updateWithRgba(value);
    }
  });

  // Initialize
  updateIndicator();

  Object.defineProperty(el, 'value', {
    get: () => indicator.value as HexColor,
    set: updateWithRgba,
  });

  // Add pop out effect to the dialog
  autoPopOutDialog(el);

  const showModal = (x: number, y: number) => {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.showModal();
  };

  return { el, showModal, getter: () => indicator.value, setter: updateWithRgba };
};
