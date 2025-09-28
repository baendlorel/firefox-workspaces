import { div, h } from '@/lib/dom.js';

interface ColorPickerOptions {
  onChange: (color: string) => void;
  initial: string;
}

// Convert angle and radius to color
const getColorAngleFromPosition = (x: number, y: number, rect: DOMRect): number => {
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const deltaX = x - centerX;
  const deltaY = y - centerY;

  // Calculate angle (0-360 degrees)
  let angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
  if (angle < 0) {
    angle += 360;
  }

  return angle;
};

// Convert HSL to HEX
const hslToHex = (angle: number): HexColor => {
  const h = angle;
  const s = 1;
  const l = 0.5;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}` as HexColor;
};

const change = (_: HexColor) => {};

export default (options: Partial<ColorPickerOptions>) => {
  const { onChange = change, initial = '#ffffff' } = options;

  // Create the main circular color picker
  const palette = div('palette');
  palette.style.setProperty('--pallete-value', initial);

  const inputHex = h('input', {
    type: 'text',
    class: 'text-center',
    style: 'width:120px;height:30px',
  });
  inputHex.value = initial;

  const el = div('', [palette, inputHex]);

  // # register events
  const pick = (x: number, y: number, rect: DOMRect) => {
    const angle = getColorAngleFromPosition(x, y, rect);
    const hex = hslToHex(angle);
    inputHex.value = hex;
    palette.style.setProperty('--pallete-value', hex);
    onChange(hex);
  };

  // Mouse down handler
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    pick(x, y, rect);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', handleMouseMove);
    });
  };

  // Mouse move handler
  const handleMouseMove = (e: MouseEvent) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if mouse is still within reasonable bounds of the color wheel
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

    if (distance <= rect.width / 2 + 20) {
      pick(x, y, rect);
    }
  };

  inputHex.addEventListener('mousedown', (e) => e.stopImmediatePropagation());
  palette.addEventListener('mousedown', handleMouseDown);

  return el;
};
