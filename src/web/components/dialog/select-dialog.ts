import { i } from '@/lib/polyfilled-api.js';

import { btn, h } from '@/lib/dom.js';
import { createDialog } from './index.js';

export default async (config: {
  title?: string;
  message?: string;
  options: { value: any; label: HTMLElement | string }[];
}): Promise<any> => {
  let resolve!: (value: any) => void;
  const promise = new Promise<any>((res) => (resolve = res));

  const { title, message = '', options } = config;
  if (options.length === 0) {
    logger.warn('No options provided for select dialog.');
    resolve(null);
    return promise;
  }

  let value: any = null;

  // # body
  const msg = h('p', 'dialog-message', message);
  let useElement = false;
  const selection = options.map((o) => {
    const label = typeof o.label === 'string' ? o.label : ((useElement = true), [o.label]);
    const op = h('li', 'dialog-li-option', label);
    op.onclick = () => {
      value = o.value;
      selection.forEach((s) => s.classList.toggle('selected', s === op));
    };
    return op;
  });
  const ul = h('ul', 'dialog-ul-options', selection);
  ul.classList.toggle('use-element', useElement);

  const confirmBtn = btn(
    { class: 'btn btn-primary ms-2', type: 'button' },
    i('dialog.type.confirm')
  );
  const cancelBtn = btn({ class: 'btn btn-secondary', type: 'button' }, i('button.cancel'));
  confirmBtn.title = i('button.confirm-selection');
  cancelBtn.title = i('button.cancel-and-close');

  const { dialog } = createDialog(title, [msg, ul], [cancelBtn, confirmBtn]);
  dialog.bus.on('closed', () => resolve(value));
  dialog.escClosable = true;
  cancelBtn.addEventListener('click', () => ((value = null), dialog.bus.emit('close')));
  confirmBtn.addEventListener('click', () => dialog.bus.emit('close'));

  // mount to body
  document.body.appendChild(dialog);

  dialog.bus.emit('show');

  return promise;
};
