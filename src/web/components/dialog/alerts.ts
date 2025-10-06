import { i } from '@/lib/polyfilled-api.js';

import { btn } from '@/lib/dom.js';
import { createDialog } from './index.js';

export const info = (message: string, title: string = i('dialog.type.information')) => {
  return new Promise<void>((resolve) => {
    const dialog = createDialog(title, message).dialog;
    dialog.bus.on('closed', resolve);
    document.body.appendChild(dialog);
    dialog.bus.emit('show');
  });
};

export const warning = (message: string, title: string = i('dialog.type.warning')) => {
  return new Promise<void>((resolve) => {
    const dialog = createDialog(title, message).dialog;
    dialog.bus.on('closed', resolve);
    dialog.setAttribute('type', 'warning');
    document.body.appendChild(dialog);
    dialog.bus.emit('show');
  });
};

export const danger = (message: string, title: string = i('dialog.type.danger')) => {
  return new Promise<void>((resolve) => {
    const dialog = createDialog(title, message).dialog;
    dialog.bus.on('closed', resolve);
    dialog.setAttribute('type', 'danger');
    document.body.appendChild(dialog);
    dialog.bus.emit('show');
  });
};

/**
 * Since `confirm` is taken
 */
export const confirmation = (message: string, title: string = i('dialog.type.confirm')) => {
  return new Promise<boolean>((resolve) => {
    const yesBtn = btn('btn btn-primary ms-2', i('button.yes'));
    yesBtn.title = i('button.yes');
    const noBtn = btn('btn btn-secondary', i('button.no'));
    yesBtn.title = i('button.no');
    const dialog = createDialog(title, message, [noBtn, yesBtn]).dialog;

    yesBtn.onclick = () => {
      dialog.bus.emit('close');
      dialog.bus.on('closed', () => resolve(true));
    };
    noBtn.onclick = () => {
      dialog.bus.emit('close');
      dialog.bus.on('closed', () => resolve(false));
    };

    document.body.appendChild(dialog);
    dialog.bus.emit('show');
  });
};
