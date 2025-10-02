import '@/lib/promise-ext.js';
import { btn, h } from '@/lib/dom.js';
import { i } from '@/lib/ext-apis.js';
import { createDialog } from './index.js';

export default async (config: {
  title?: string;
  message?: string;
  options: { value: any; label: HTMLElement | string }[];
}): Promise<any> => {
  const { promise, resolve } = Promise.create<number | null>();
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

  const confirmBtn = btn({ class: 'btn btn-primary ms-2', type: 'button' }, i('confirm'));
  const cancelBtn = btn({ class: 'btn btn-secondary', type: 'button' }, i('cancel'));
  confirmBtn.title = i('confirmSelection');
  cancelBtn.title = i('cancelAndClose');

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
