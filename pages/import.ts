import { $notify, $send } from '@/lib/polyfilled-api.js';

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
      // todo 导入导出改用pseudojson制作，避免NaN变成null的问题
      const data = JSON.parse(text);
      await $send({ action: Action.ReturnFileData, data });
      const cur = await browser.tabs.getCurrent();
      if (cur?.id !== undefined) {
        browser.tabs.remove(cur.id);
      }
    } catch (error) {
      $notify('Failed to import data: ' + (error as Error).message);
    }
  });

  const openBtn = document.getElementById('open-file-input');
  if (openBtn) {
    openBtn.addEventListener('click', () => input.click());
  }
});
