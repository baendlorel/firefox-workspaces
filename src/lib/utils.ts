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

  // & FNV-1a（Fowler–Noll–Vo hash, variant 1a）
  const sorted = sortObject(obj);
  const str = JSON.stringify(sorted);
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0; // FNV prime, 保持32位
  }
  return hash.toString(16);
}
