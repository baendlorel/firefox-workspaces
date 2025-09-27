import { btn } from '@/lib/dom.js';
import { createDialog } from './index.js';

// GOAL Add to example of kt.js
export const info = (message: string, title: string = 'Information') => {
  return new Promise<void>((resolve) => {
    const dialog = createDialog(title, message).dialog;
    dialog.bus.on('closed', resolve);
    document.body.appendChild(dialog);
    dialog.bus.emit('show');
  });
};

export const warning = (message: string, title: string = 'Warning') => {
  return new Promise<void>((resolve) => {
    const dialog = createDialog(title, message).dialog;
    dialog.bus.on('closed', resolve);
    dialog.setAttribute('type', 'warning');
    document.body.appendChild(dialog);
    dialog.bus.emit('show');
  });
};

export const danger = (message: string, title: string = 'Danger') => {
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
export const confirmation = (message: string, title: string = 'Information') => {
  return new Promise<boolean>((resolve) => {
    const yesBtn = btn({ class: 'btn btn-primary', style: 'margin-left:10px;' }, 'Yes');
    const noBtn = btn('btn btn-secondary', 'No');
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
