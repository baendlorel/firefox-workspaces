import { i } from '@/lib/polyfilled-api.js';

document.addEventListener('DOMContentLoaded', () => {
  const list = document.querySelectorAll('[data-i18n]');
  logger.verbose('common.js loaded');
  for (let index = 0; index < list.length; index++) {
    const e = list[index];
    const key = (e as HTMLElement).dataset?.i18n;
    if (key === 'about.version') {
      e.textContent = 'v__VERSION__';
    } else if (typeof key === 'string') {
      e.textContent = i(key as any);
    }
  }
});
