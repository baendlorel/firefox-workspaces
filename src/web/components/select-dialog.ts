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
  const msg = div('dialog-message', message);
  const selection = options.map((o) => {
    const op = h('li', 'dialog-li-option', o.label);
    op.onclick = () => {
      value = o.value;
      selection.forEach((s) => s.classList.toggle('selected', s === op));
    };
    return op;
  });
  const ul = h('ul', 'dialog-ul-options', selection);
  const body = div('dialog-footer', [msg, ul]);

  const { dialog, closeBtn, confirmBtn } = createDialog(title, [body]);

  // # define handlers
  const close = () => {
    // Add exit animation
    dialog.classList.remove('animate-in');
    dialog.classList.add('animate-out');

    // Close after animation completes
    setTimeout(() => {
      dialog.close();
      dialog.classList.remove('animate-out');
      resolve(value);
    }, 250); // Match the animation duration
  };

  // # register events
  closeBtn.addEventListener('click', close);
  confirmBtn.addEventListener('click', close);

  // mount to body
  document.body.appendChild(dialog);
  dialog.showModal();

  return promise;
};
