import { Action } from '@/lib/consts.js';
import { h } from '@/lib/dom.js';

function createFileInput() {
  const h1 = h('h1', '', 'InputFile');
  const input = h('input', {
    type: 'file',
    accept: '.json,application/json',
  });

  input.addEventListener('change', () => {
    if (!input.files || input.files.length === 0) {
      logger.warn('No file selected');
      return;
    }
    const file = input.files[0];

    file.text().then((data) => {
      logger.info('file content', data);
      browser.runtime.sendMessage({ action: Action.ReturnFileData, data });
    });
  });

  document.body.append(h1, input);

  input.click();
}

document.addEventListener('DOMContentLoaded', () => {
  createFileInput();
});
