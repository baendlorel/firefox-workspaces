export const $randInt = (max: number) => Math.floor(Math.random() * max);

export const $randChar = () => {
  const r = $randInt(36);
  // use ascii to save the memory of '0-9a-z' string
  return r < 10 ? String.fromCharCode(48 + r) : String.fromCharCode(97 + (r - 10));
};

export const $genId = () => {
  const digits: string[] = ['kskb_', String(Date.now()), '_'];
  for (let i = 0; i < 16; i++) {
    digits.push($randChar());
  }
  return digits.join('');
};

export const $sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const $truncate = (s: string, maxLen = 50) => {
  if (!s) {
    return '';
  }
  if (s.length <= maxLen) {
    return s;
  }
  return s.substring(0, maxLen - 3) + '...';
};

export const $debounce = <T extends (...a: any[]) => any>(fn: T, thisArg: any, delay: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>): void {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => fn.apply(thisArg, args), delay);
  };
};

// Hash a plain object, order-insensitive

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
