import { EventBus } from 'minimal-event-bus';
import { h, div, btn } from '@/lib/dom.js';
import closeSvg from '@web/assets/close.svg?raw';

export function createDialog(header: HTMLPart | undefined, body: HTMLPart): Dialog;
export function createDialog(
  header: HTMLPart | undefined,
  body: HTMLPart,
  footer: HTMLElement[]
): Omit<Dialog, 'yesBtn'>;
export function createDialog(
  header: HTMLPart | undefined,
  body: HTMLPart,
  footer?: HTMLPart
): Omit<Dialog, 'yesBtn'> | Dialog {
  const bus = new EventBus<DialogEventMap>();

  const dialog = h('dialog', 'dialog-container');
  const content = div('dialog-content');

  Reflect.set(dialog, 'bus', bus);
  dialog.escClosable = false;
  dialog.backdropClosable = false;

  dialog.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') {
      return;
    }

    // * prevent the default instant closing of <dialog> on Esc
    // must use my animated version
    e.preventDefault();
    if (dialog.escClosable) {
      bus.emit('close');
    }
  });

  dialog.addEventListener(
    'click',
    (e) => e.target === dialog && dialog.backdropClosable && bus.emit('close')
  );

  // # public methods
  const setTitle = (text: string) => (title.textContent = text);

  // # header
  const closeBtn = btn({ class: 'dialog-close-btn', type: 'button' });
  closeBtn.innerHTML = closeSvg;

  const title = div('title', header ?? '');
  const headerInner = typeof header === 'string' ? [title, closeBtn] : (header ?? '');
  const headerDiv = div('dialog-header', headerInner);

  // # body
  const bodyInner = typeof body === 'string' ? [div('', body)] : body;
  const bodyDiv = div('dialog-body', bodyInner);

  // # controller
  const show = () => {
    // Remove any existing animation classes
    dialog.classList.remove('animate-in', 'animate-out');

    if (header === undefined) {
      headerDiv.remove();
    }

    dialog.showModal();

    // Add entrance animation
    requestAnimationFrame(() => dialog.classList.add('animate-in'));

    setTimeout(() => bus.emit('shown'), 250);
  };

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

  closeBtn.addEventListener('click', close);
  bus.on('close', close);
  bus.on('show', show);

  // # no footer
  if (!footer) {
    const yesBtn = btn({ class: 'btn btn-primary', type: 'button' }, 'Yes');
    content.append(headerDiv, bodyDiv, div('dialog-footer', [yesBtn]));
    dialog.appendChild(content);

    yesBtn.addEventListener('click', close);

    return {
      dialog,
      closeBtn,
      yesBtn,
      setTitle,
    };
  }

  // # footer provided
  const footerInner = typeof footer === 'string' ? [div('', footer)] : [...footer];
  content.append(headerDiv, bodyDiv, div('dialog-footer', footerInner));
  dialog.appendChild(content);

  return {
    dialog,
    closeBtn,
    setTitle,
  };
}
