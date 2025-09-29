/**
 * Color utility class for handling color conversions and manipulations
 */
export class Color {
  r: number;
  g: number;
  b: number;
  a: number;

  constructor(r: number, g: number, b: number, a: number = 255) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  /**
   * Create a Color instance from HSV values
   * @param h - Hue (0-360)
   * @param s - Saturation (0-1)
   * @param v - Value/Brightness (0-1)
   * @param a - Alpha (0-255), optional, defaults to 255
   * @returns New Color instance
   */
  static create(h: number, s: number, v: number, a: number = 255): Color {
    const [r, g, b] = Color.hsvToRgb(h, s, v);
    return new Color(r, g, b, a);
  }

  /**
   * Create a Color instance from hex string
   * @param hex - Hex color string (e.g., '#ff0000' or '#ff0000ff')
   * @returns New Color instance
   */
  static from(hex: string): Color {
    const [r, g, b, a] = Color.hexToRgba(hex);
    return new Color(r, g, b, a);
  }

  get brightness(): number {
    return (this.r * 299 + this.g * 587 + this.b * 114) / 1000;
  }

  toHsv(): { h: number; s: number; v: number; a: number } {
    const r = this.r / 255;
    const g = this.g / 255;
    const b = this.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === r) {
        h = 60 * (((g - b) / delta) % 6);
      } else if (max === g) {
        h = 60 * ((b - r) / delta + 2);
      } else {
        h = 60 * ((r - g) / delta + 4);
      }
    }
    if (h < 0) {
      h += 360;
    }

    const s = max === 0 ? 0 : delta / max;
    const v = max;

    return { h, s, v, a: this.a };
  }

  /**
   * Convert to hex string without alpha (#rrggbb)
   * @returns Hex color string
   */
  toHex(): HexColor {
    return Color.rgbToHex(Math.round(this.r), Math.round(this.g), Math.round(this.b)) as HexColor;
  }

  /**
   * Convert to hex string with alpha (#rrggbbaa)
   * @returns Hex color string with alpha
   */
  toHexWithAlpha(): HexColor {
    return Color.rgbaToHex(
      Math.round(this.r),
      Math.round(this.g),
      Math.round(this.b),
      this.a / 255
    ) as HexColor;
  }

  /**
   * Adjust the brightness of the color
   * @param amount - Brightness adjustment amount (-1 to 1)
   *                 Positive values make the color brighter
   *                 Negative values make the color darker
   * @returns New Color instance with adjusted brightness
   */
  adjustBrightness(amount: number): Color {
    // Clamp amount to valid range
    amount = Math.max(-1, Math.min(1, amount));

    // Calculate adjustment factor
    const adjust = (color: number): number => {
      if (amount > 0) {
        // Brighten: move towards 255
        return color + (255 - color) * amount;
      } else {
        // Darken: move towards 0
        return color * (1 + amount);
      }
    };

    const newR = adjust(this.r);
    const newG = adjust(this.g);
    const newB = adjust(this.b);

    return new Color(newR, newG, newB, this.a);
  }

  // Static utility methods (private helpers)
  private static p16(x: number): string {
    return x.toString(16).padStart(2, '0');
  }

  /**
   * Convert HSV to RGB
   * @param h - Hue (0-360)
   * @param s - Saturation (0-1)
   * @param v - Value/Brightness (0-1)
   * @returns RGB values as [r, g, b] (0-255)
   */
  private static hsvToRgb(h: number, s: number, v: number): [number, number, number] {
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
  }

  /**
   * Convert RGB to Hex
   * @param r - Red (0-255)
   * @param g - Green (0-255)
   * @param b - Blue (0-255)
   * @returns Hex color string
   */
  private static rgbToHex(r: number, g: number, b: number): string {
    return '#' + Color.p16(r) + Color.p16(g) + Color.p16(b);
  }

  /**
   * Convert RGBA to Hex with alpha
   * @param r - Red (0-255)
   * @param g - Green (0-255)
   * @param b - Blue (0-255)
   * @param a - Alpha (0-1)
   * @returns Hex color string with alpha
   */
  private static rgbaToHex(r: number, g: number, b: number, a: number): string {
    const hex = Color.rgbToHex(r, g, b);
    if (a < 1) {
      const alphaHex = Math.round(a * 255)
        .toString(16)
        .padStart(2, '0');
      return hex + alphaHex;
    }
    return hex;
  }

  /**
   * Parse hex color string to RGBA values
   * @param value - Hex color string (e.g., '#ff0000' or '#ff0000ff')
   * @returns RGBA values as [r, g, b, a] (0-255)
   */
  private static hexToRgba(value: string): [number, number, number, number] {
    // Parse hex color
    const hex = value.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = hex.length > 6 ? parseInt(hex.substring(6, 8), 16) : 255;
    return [r, g, b, a];
  }
}
