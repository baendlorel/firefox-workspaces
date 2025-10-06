import { $notify, i } from '@/lib/ext-apis.js';

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('import') as HTMLInputElement;

  input.addEventListener('change', async () => {
    if (!input.files || input.files.length === 0) {
      console.warn('No file selected');
      return;
    }
    const file = input.files[0];

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await browser.runtime.sendMessage({ action: Action.ReturnFileData, data });
      const cur = await browser.tabs.getCurrent();
      if (cur?.id !== undefined) {
        browser.tabs.remove(cur.id);
      }
    } catch (error) {
      $notify('Failed to import data: ' + (error as Error).message, i('import.notification-title'));
    }
  });

  const openBtn = document.getElementById('open-file-input');
  if (openBtn) {
    openBtn.addEventListener('click', () => input.click());
  }
});
