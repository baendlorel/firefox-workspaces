const p16 = (x: number) => x.toString(16).padStart(2, '0');

// Convert HSV to RGB
export const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
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
export const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + p16(r) + p16(g) + p16(b);
};

// Convert RGBA to Hex with alpha
export const rgbaToHex = (r: number, g: number, b: number, a: number): string => {
  const hex = rgbToHex(r, g, b);
  if (a < 1) {
    const alphaHex = Math.round(a * 255)
      .toString(16)
      .padStart(2, '0');
    return hex + alphaHex;
  }
  return hex;
};

export const hexToRgba = (value: string): [number, number, number, number] => {
  // Parse hex color
  const hex = value.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const a = hex.length > 6 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;
  return [r, g, b, a];
};

/**
 * Adjust the brightness of a hex color
 * @param hex - The hex color string (e.g., '#ff0000' or '#ff0000ff')
 * @param amount - Brightness adjustment amount (-100 to 100)
 *                 Positive values make the color brighter
 *                 Negative values make the color darker
 * @returns The adjusted hex color string
 */
export const adjustBrightness = (hex: string, amount: number): string => {
  // Clamp amount to valid range
  amount = Math.max(-100, Math.min(100, amount)) / 100;

  // Parse hex color
  const [r, g, b, a] = hexToRgba(hex);

  // Calculate adjustment factor
  // For positive amounts: interpolate towards white (255)
  // For negative amounts: interpolate towards black (0)
  const adjust = (color: number): number => {
    if (amount > 0) {
      // Brighten: move towards 255
      return Math.round(color + (1 - color) * amount);
    } else {
      // Darken: move towards 0
      return Math.round(color * (1 + amount));
    }
  };

  console.log(r, g, b);
  const newR = adjust(r);
  const newG = adjust(g);
  const newB = adjust(b);

  console.log(newR, newG, newB);
  // Convert back to hex
  return rgbaToHex(newR * 255, newG * 255, newB * 255, a);
};
