import { Action } from '@/lib/consts.js';
import { $id } from '@/lib/dom.js';
import { i } from '@/lib/ext-apis.js';

function createFileInput() {
  const label = $id('intro');
  label.textContent = i('popup.file-input.intro');

  const input = $id('import') as HTMLInputElement;
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

  const opener = $id('open-file-input') as HTMLButtonElement;
  opener.onclick = () => input.click();
  opener.textContent = i('popup.file-input.opener');
}

document.addEventListener('load', () => {
  const title = document.querySelector('title');
  if (title) {
    title.textContent = i('popup.file-input.title');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  createFileInput();
});
