export const $randInt = (max: number) => Math.floor(Math.random() * max);

const alphabets = '0123456789abcdefghijklmnopqrstuvwxyz' as const;
export const $genId = () => {
  const digits: string[] = ['kskb_', String(Date.now())];
  for (let i = 0; i < 16; i++) {
    digits.push(alphabets[$randInt(36)]);
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

export const $escapeHtml = (text: string) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
