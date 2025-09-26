import { h, div, btn } from '@/lib/dom.js';
import { EventBus } from '../event-bus.js';
import closeSvg from '@web/assets/close.svg?raw';

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

  Reflect.set(dialog, 'bus', bus);
  dialog.escClosable = false;
  dialog.backdropClosable = false;

  /**
   * `<dialog>`'s cancel event should be cancelable, but only in FireFox, not in Edge.
   * So we disable esc globally and prevent its default action.
   *
   * @param e
   */
  const preventEsc = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    console.log('ESC default prevented');
    if (dialog.escClosable) {
      console.log('escClosable');
      bus.emit('close');
    }
  };

  dialog.addEventListener(
    'click',
    (e) => e.target === dialog && dialog.backdropClosable && bus.emit('close')
  );

  // # header
  const closeBtn = btn({ class: 'dialog-close-btn', type: 'button' });
  closeBtn.innerHTML = closeSvg;

  const headerInner = typeof header === 'string' ? [div('title', header), closeBtn] : header;
  const headerDiv = div('dialog-header', headerInner);

  // # body
  const bodyInner = typeof body === 'string' ? [div('', body)] : body;
  const bodyDiv = div('dialog-body', bodyInner);

  // # controller
  const show = () => {
    // Remove any existing animation classes
    dialog.classList.remove('animate-in', 'animate-out');
    document.addEventListener('keydown', preventEsc);

    dialog.showModal();

    // Add entrance animation
    requestAnimationFrame(() => {
      dialog.classList.add('animate-in');
    });

    setTimeout(() => bus.emit('shown'), 250);
  };

  const close = () => {
    // Add exit animation
    dialog.classList.remove('animate-in');
    dialog.classList.add('animate-out');

    document.removeEventListener('keydown', preventEsc);

    // Close after animation completes
    setTimeout(() => {
      dialog.close();
      dialog.classList.remove('animate-out');
      bus.emit('closed');
      bus.emit('confirmed');
    }, 250); // Match the animation duration
  };

  closeBtn.addEventListener('click', close);
  bus.on('close', close);
  bus.on('show', show);

  // # no footer
  if (!footer) {
    const confirmBtn = btn({ class: 'btn btn-primary', type: 'button' }, 'Confirm');
    content.append(headerDiv, bodyDiv, div('dialog-footer', [confirmBtn]));
    dialog.appendChild(content);

    confirmBtn.addEventListener('click', close);

    return {
      dialog,
      closeBtn,
      confirmBtn,
    };
  }

  // # footer provided
  const footerInner = typeof footer === 'string' ? [div('', footer)] : [...footer];
  content.append(headerDiv, bodyDiv, div('dialog-footer', footerInner));
  dialog.appendChild(content);

  return {
    dialog,
    closeBtn,
  };
}
