import { $createElement } from './dom.js';
import { $NumberToString, $now, $ArrayPush, $randInt, $ArrayJoin, $SubString } from './native.js';

const alphabets = '0123456789abcdefghijklmnopqrstuvwxyz' as const;
export const $genId = () => {
  const digits: string[] = ['kskb_', $NumberToString.call($now())];
  for (let i = 0; i < 16; i++) {
    $ArrayPush.call(digits, alphabets[$randInt(36)]);
  }
  return $ArrayJoin.call(digits, '');
};

export const $sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const $truncate = (s: string, maxLen = 50) => {
  if (!s) {
    return '';
  }
  if (s.length <= maxLen) {
    return s;
  }
  return $SubString.call(s, 0, maxLen - 3) + '...';
};

export const $escapeHtml = (text: string) => {
  const div = $createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
