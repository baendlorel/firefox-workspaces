import { h, div, btn } from '@/lib/dom.js';

type HTMLPart = HTMLElement[] | string;

export function createDialog(header: HTMLPart, body: HTMLPart): Dialog;
export function createDialog(
  header: HTMLPart,
  body: HTMLPart,
  footer: HTMLElement[]
): Omit<Dialog, 'confirmBtn'>;
export default function createDialog(header: HTMLPart, body: HTMLPart, footer?: HTMLPart) {
  const dialog = h('dialog', 'dialog-container');
  const content = div('dialog-content');

  // # header
  const closeBtn = btn({ class: 'dialog-close-btn', type: 'button' });
  const headerInner = typeof header === 'string' ? [div('title', header), closeBtn] : header;
  const headerDiv = div('dialog-header', headerInner);

  // # body
  const bodyInner = typeof body === 'string' ? [div('', body)] : body;
  const bodyDiv = div('dialog-footer', bodyInner);

  // # footer
  if (!footer) {
    const confirmBtn = btn({ class: 'btn btn-primary', type: 'button' }, 'Confirm');
    const footerDiv = div('dialog-footer', [confirmBtn]);
    content.append(headerDiv, bodyDiv, footerDiv);
    dialog.appendChild(content);
    return {
      dialog,
      closeBtn,
      confirmBtn,
    };
  }
  const footerInner = typeof footer === 'string' ? [div('', footer)] : [...footer];
  const footerDiv = div('dialog-footer', footerInner);

  content.append(headerDiv, bodyDiv, footerDiv);
  dialog.appendChild(content);
  return {
    dialog,
    closeBtn,
  };
}
