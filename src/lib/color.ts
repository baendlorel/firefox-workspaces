const p16 = (x: number) => Math.round(x).toString(16).padStart(2, '0');

export class Color {
  /**
   * Create a Color instance from HSV values
   */
  static create(h: number, s: number, v: number, a: number = 255): Color {
    const [r, g, b] = Color.hsvToRgb(h, s, v);
    return new Color(r, g, b, a);
  }

  /**
   * Create a Color instance from hex string
   */
  static from(hex: string): Color {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = hex.length > 6 ? parseInt(hex.substring(6, 8), 16) : 255;
    return new Color(r, g, b, a);
  }

  static valid(color: string): color is HexColor {
    return /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(color);
  }

  constructor(
    public readonly r: number,
    public readonly g: number,
    public readonly b: number,
    public readonly a: number = 255
  ) {}

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

  toHex(): HexColor {
    return Color.rgbToHex(this.r, this.g, this.b) as HexColor;
  }

  toHexa(): HexColor {
    return Color.rgbaToHex(this.r, this.g, this.b, this.a / 255) as HexColor;
  }

  /**
   * Adjust the brightness of the color.
   * - `> 0` to brighten, `< 0` to darken, range `-1` to `1`
   */
  adjustBrightness(amount: number): Color {
    amount = Math.max(-1, Math.min(1, amount));
    const adjust = (color: number) => color + (amount > 0 ? 255 - color : color) * amount;
    return new Color(adjust(this.r), adjust(this.g), adjust(this.b), this.a);
  }

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
   */
  private static rgbToHex(r: number, g: number, b: number): string {
    return '#' + p16(r) + p16(g) + p16(b);
  }

  /**
   * Convert RGBA to Hex with alpha
   */
  private static rgbaToHex(r: number, g: number, b: number, a: number): string {
    const hex = Color.rgbToHex(r, g, b);
    a = Math.max(0, Math.min(1, a));
    return hex + p16(a * 255);
  }
}
