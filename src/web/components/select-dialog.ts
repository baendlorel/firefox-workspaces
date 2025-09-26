import { btn, div, h } from '@/lib/dom.js';
import { createPromise } from '@/lib/utils.js';

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

  const el = h('dialog', 'dialog-container');
  const content = div('dialog-content');
  const closeBtn = btn({ class: 'dialog-close-btn', type: 'button' });
  const header = div('dialog-header', [h('h2', '', title), closeBtn]);
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
  const confirmBtn = btn({ class: 'btn btn-primary', type: 'button' }, 'Confirm');

  content.append(header, msg, ul, confirmBtn);
  el.appendChild(content);

  // # define handlers
  const close = () => {
    // Add exit animation
    el.classList.remove('animate-in');
    el.classList.add('animate-out');

    // Close after animation completes
    setTimeout(() => {
      el.close();
      el.classList.remove('animate-out');
      resolve(value);
    }, 250); // Match the animation duration
  };

  // # register events
  closeBtn.addEventListener('click', close);
  confirmBtn.addEventListener('click', close);

  // mount to body
  document.body.appendChild(el);

  return promise;
};
