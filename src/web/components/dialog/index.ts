import './style.css';
import { EventBus } from 'minimal-event-bus';
import { h, div, btn, svg } from '@/lib/dom.js';
import closeSvg from '@assets/close.svg?raw';
import { popIn, popOut } from '@comp/pop/index.js';

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
  const closeBtn = btn('btn-text dialog-close', [svg(closeSvg, undefined, 10)]);
  closeBtn.title = 'Close the dialog';

  const title = div('title', header ?? '');
  const headerInner = typeof header === 'string' ? [title, closeBtn] : (header ?? '');
  const headerDiv = div('dialog-header', headerInner);

  // # body
  const bodyInner = typeof body === 'string' ? [div('', body)] : body;
  const bodyDiv = div('dialog-body', bodyInner);

  // # controller
  const show = popIn(
    dialog,
    () => {
      if (header === undefined) {
        headerDiv.remove();
      }

      dialog.showModal();
    },
    () => bus.emit('shown')
  );

  const close = popOut(dialog, undefined, () => {
    dialog.close();
    bus.emit('closed');
    bus.emit('confirmed');
  });

  closeBtn.addEventListener('click', close);
  bus.on('close', close);
  bus.on('show', show);

  // # no footer
  if (!footer) {
    const yesBtn = btn('btn btn-primary', 'Yes');
    const footerDiv = div('dialog-footer', [yesBtn]);
    content.append(headerDiv, bodyDiv, footerDiv);
    dialog.appendChild(content);

    yesBtn.addEventListener('click', close);

    return {
      dialog,
      header: headerDiv,
      body: bodyDiv,
      footer: footerDiv,
      closeBtn,
      yesBtn,
      setTitle,
    };
  }

  // # footer provided
  const footerInner = typeof footer === 'string' ? [div('', footer)] : [...footer];
  const footerDiv = div('dialog-footer', footerInner);
  content.append(headerDiv, bodyDiv, footerDiv);
  dialog.appendChild(content);

  return {
    dialog,
    header: headerDiv,
    body: bodyDiv,
    footer: footerDiv,
    closeBtn,
    setTitle,
  };
}
