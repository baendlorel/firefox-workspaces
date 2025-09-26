import { btn, div, h } from '@/lib/dom.js';
import { createPromise } from '@/lib/utils.js';
import { createDialog } from './dialog.js';

export default async (config: {
  title?: string;
  message?: string;
  options: { value: any; label: string }[];
}): Promise<any> => {
  const { promise, resolve } = createPromise<number | null>();
  const { title = 'Select an option', message = '', options } = config;
  if (options.length === 0) {
    console.warn('[__NAME__: __func__] No options provided for select dialog.');
    resolve(null);
    return promise;
  }

  let value: any = null;

  // # body
  const msg = h('p', 'dialog-message', message);
  const selection = options.map((o) => {
    const op = h('li', 'dialog-li-option', o.label);
    op.onclick = () => {
      value = o.value;
      selection.forEach((s) => s.classList.toggle('selected', s === op));
    };
    return op;
  });
  const ul = h('ul', 'dialog-ul-options', selection);

  const { dialog } = createDialog(title, [msg, ul]);
  dialog.bus.on('closed', () => resolve(value));
  dialog.escClosable = true;

  // mount to body
  document.body.appendChild(dialog);

  dialog.bus.emit('show');

  return promise;
};
