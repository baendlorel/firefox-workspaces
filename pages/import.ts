import { Action } from '@/lib/consts.js';

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
      const result = await browser.runtime.sendMessage({ action: Action.ReturnFileData, data });
    } catch (error) {
      // display error
    }
    // todo 移动到一个新的文件夹里，专门放这些文件
    // todo 导入完成给个提示
  });
});
