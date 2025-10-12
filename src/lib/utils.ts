// # random
const $randInt = (max: number) => Math.floor(Math.random() * max);

export const $randItem = <T extends any[] | string>(items: T): T extends (infer U)[] ? U : string =>
  items[$randInt(items.length)];

const letters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const $genId = (n: number = 6) => {
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
 * Calculate SHA-256 hash of a string
 */
export async function $sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
