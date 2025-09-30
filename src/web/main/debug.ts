import { $id, btn } from '@/lib/dom.js';

export const stringify = (a: any): any => {
  if (a === null) {
    return null;
  }
  if (typeof a !== 'object') {
    return a;
  }

  if (Array.isArray(a)) {
    return a.map(stringify);
  }

  const res: string[] = [];
  for (const key in a) {
    if (!Object.hasOwn(a, key)) {
      continue;
    }
    res.push(`${key}: ${stringify(a[key])}`);
  }

  return '{' + res.join(', ') + '}';
};
