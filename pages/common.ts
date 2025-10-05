import { i as $i } from '@/lib/ext-apis.js';

document.addEventListener('DOMContentLoaded', () => {
  const list = document.querySelectorAll('[data-i18n]');
  logger.verbose('common.js loaded');
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    const key = (e as HTMLElement).dataset?.i18n;
    if (typeof key === 'string') {
      e.textContent = $i(key as any);
      logger.verbose(key, $i(key as any));
    }
  }
});
