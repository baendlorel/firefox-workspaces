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

//{
//   id: tab.id ?? NaN,
//   url: browserTab.url ?? '',
//   title: browserTab.title ?? '',
//   favIconUrl: browserTab.favIconUrl ?? '',
//   addedAt: Date.now(),
//};
export const $createTabInfo = (tab: browser.tabs.Tab): TabInfo => ({
  id: tab.id ?? NaN,
  url: tab.url ?? '[No URL]',
  title: tab.title ?? '[No Title]',
  favIconUrl: tab.favIconUrl ?? '[No Favicon]',
  pinned: tab.pinned,
  addedAt: Date.now(),
});

// Update workspace if tab URL or title changed in a workspace window
// tabs[index] = {
//   ...tabs[index],
//   url: browserTab.url ?? '',
//   title: browserTab.title ?? '',
//   favIconUrl: browserTab.favIconUrl ?? '',
// };
export const $mergeTabInfo = (tab: TabInfo, browserTab: browser.tabs.Tab): TabInfo => ({
  id: tab.id ?? browserTab.id ?? NaN,
  url: browserTab.url ?? tab.url ?? '[No URL]',
  title: browserTab.title ?? tab.title ?? '[No Title]',
  favIconUrl: browserTab.favIconUrl ?? tab.favIconUrl ?? '[No Favicon]',
  pinned: browserTab.pinned ?? tab.pinned,
  addedAt: tab.addedAt ?? Date.now(),
});
