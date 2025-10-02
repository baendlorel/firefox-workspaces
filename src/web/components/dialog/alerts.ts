import { btn } from '@/lib/dom.js';
import { i } from '@/lib/ext-apis.js';
import { createDialog } from './index.js';

export const info = (message: string, title: string = i('information')) => {
  return new Promise<void>((resolve) => {
    const dialog = createDialog(title, message).dialog;
    dialog.bus.on('closed', resolve);
    document.body.appendChild(dialog);
    dialog.bus.emit('show');
  });
};

export const warning = (message: string, title: string = i('warning')) => {
  return new Promise<void>((resolve) => {
    const dialog = createDialog(title, message).dialog;
    dialog.bus.on('closed', resolve);
    dialog.setAttribute('type', 'warning');
    document.body.appendChild(dialog);
    dialog.bus.emit('show');
  });
};

export const danger = (message: string, title: string = i('danger')) => {
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
export const confirmation = (message: string, title: string = i('confirm')) => {
  return new Promise<boolean>((resolve) => {
    const yesBtn = btn('btn btn-primary ms-2', i('yes'));
    yesBtn.title = i('yes');
    const noBtn = btn('btn btn-secondary', i('no'));
    yesBtn.title = i('no');
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
