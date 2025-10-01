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

export const $escapeHtml = (text: string) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
