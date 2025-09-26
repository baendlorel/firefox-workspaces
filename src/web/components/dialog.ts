import { h, div, btn } from '@/lib/dom.js';
import { EventBus } from '../event-bus.js';
import closeSvg from '@web/assets/close.svg?raw';

type HTMLPart = HTMLElement[] | string;

export function createDialog(header: HTMLPart, body: HTMLPart): Dialog;
export function createDialog(
  header: HTMLPart,
  body: HTMLPart,
  footer: HTMLElement[]
): Omit<Dialog, 'confirmBtn'>;
export function createDialog(header: HTMLPart, body: HTMLPart, footer?: HTMLPart) {
  const bus = new EventBus<DialogEventMap>();

  const dialog = h('dialog', 'dialog-container');
  const content = div('dialog-content');

  // # header
  const closeBtn = btn({ class: 'dialog-close-btn', type: 'button' });
  closeBtn.innerHTML = closeSvg;

  const headerInner = typeof header === 'string' ? [div('title', header), closeBtn] : header;
  const headerDiv = div('dialog-header', headerInner);

  console.log('closeSvg', closeSvg);

  // # body
  const bodyInner = typeof body === 'string' ? [div('', body)] : body;
  const bodyDiv = div('dialog-body', bodyInner);

  // & no footer
  if (!footer) {
    const confirmBtn = btn({ class: 'btn btn-primary', type: 'button' }, 'Confirm');
    const footerDiv = div('dialog-footer', [confirmBtn]);
    content.append(headerDiv, bodyDiv, footerDiv);
    dialog.appendChild(content);

    const close = () => {
      // Add exit animation
      dialog.classList.remove('animate-in');
      dialog.classList.add('animate-out');

      // Close after animation completes
      setTimeout(() => {
        dialog.close();
        dialog.classList.remove('animate-out');
        bus.emit('closed');
        bus.emit('confirmed');
      }, 250); // Match the animation duration
    };

    confirmBtn.addEventListener('click', close);

    return {
      bus,
      dialog,
      closeBtn,
      confirmBtn,
    };
  }

  // # footer provided
  const footerInner = typeof footer === 'string' ? [div('', footer)] : [...footer];
  const footerDiv = div('dialog-footer', footerInner);

  // # define handlers
  const close = () => {
    // Add exit animation
    dialog.classList.remove('animate-in');
    dialog.classList.add('animate-out');

    // Close after animation completes
    setTimeout(() => {
      dialog.close();
      dialog.classList.remove('animate-out');
      bus.emit('closed');
    }, 250); // Match the animation duration
  };

  // # register events
  closeBtn.addEventListener('click', close);
  content.append(headerDiv, bodyDiv, footerDiv);
  dialog.appendChild(content);
  return {
    bus,
    dialog,
    closeBtn,
  };
}
