// # random
const $randInt = (max: number) => Math.floor(Math.random() * max);

export const $randItem = <T extends any[] | string>(items: T): T extends (infer U)[] ? U : string =>
  items[$randInt(items.length)];

const letters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const $genId = (n: number = 16) => {
  const digits: string[] = ['kskb_', String(Date.now()), '_'];
  for (let i = 0; i < n; i++) {
    digits.push($randItem(letters));
  }
  return digits.join('');
};

// # time functions
export const $sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const p2 = (x: number) => String(x).padStart(2, '0');

/**
 * Time in "YYYY-MM-DD HH:MM:SS" format
 */
export const $tdt = (dt: Date = new Date()) => {
  const y = dt.getFullYear();
  const m = p2(dt.getMonth() + 1);
  const d = p2(dt.getDate());
  const h = p2(dt.getHours());
  const min = p2(dt.getMinutes());
  const s = p2(dt.getSeconds());
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
};

/**
 * Time in "HH:MM" format
 */
export const $thm = (dt: Date = new Date()) => {
  const h = p2(dt.getHours());
  const min = p2(dt.getMinutes());
  return `${h}:${min}`;
};

/**
 * Time in "YYYY-MM-DD_HH-MM-SS" format (suitable for filename)
 */
export const $tdtDashed = (dt: Date = new Date()) => {
  const y = dt.getFullYear();
  const m = p2(dt.getMonth() + 1);
  const d = p2(dt.getDate());
  const h = p2(dt.getHours());
  const min = p2(dt.getMinutes());
  const s = p2(dt.getSeconds());
  return `${y}-${m}-${d}_${h}-${min}-${s}`;
};

// # misc
/**
 * Hash a plain object, order-insensitive
 */
export function $objectHash(obj: any): string {
  const sortObject = (o: any): any => {
    if (Array.isArray(o)) {
      return o.map(sortObject);
    }
    if (!o || typeof o !== 'object') {
      return o;
    }

    const keys = Object.keys(o).sort();
    const sorted = {} as any;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      sorted[k] = sortObject(o[k]);
    }

    return sorted;
  };

  // & FNV1 composed with FNV-1a
  const sorted = sortObject(obj);
  const str = JSON.stringify(sorted);
  let h1 = 0x811c9dc5; // FNV1-32 offset basis
  let h2 = 0xcbf29ce4; // FNV1a-32 offset basis
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    h1 = (h1 * 0x01000193) ^ char;
    h1 = h1 >>> 0;
    h2 = (h2 ^ char) * 0x01000193;
    h2 = h2 >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}
