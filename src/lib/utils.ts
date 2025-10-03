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

/**
 * Hash a plain object, order-insensitive
 */
export function $objectHash(obj: any): string {
  // Recursively sort keys
  function sortObject(o: any): any {
    if (Array.isArray(o)) return o.map(sortObject);
    if (o && typeof o === 'object' && o.constructor === Object) {
      return Object.keys(o)
        .sort()
        .reduce((acc, k) => {
          acc[k] = sortObject(o[k]);
          return acc;
        }, {} as any);
    }
    return o;
  }

  // & FNV-1a（Fowler–Noll–Vo hash, variant 1a）
  const str = JSON.stringify(sortObject(obj));
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0; // FNV prime, 保持32位
  }
  return hash.toString(16);
}
