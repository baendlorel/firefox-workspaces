import { createDialog } from './index.js';

export const info = (message: string, title: string = 'Information') => {
  return new Promise<void>((resolve) => {
    const o = createDialog(title, message);
    o.dialog.bus.on('closed', resolve);
  });
};

export const warning = (message: string, title: string = 'Warning') => {
  return new Promise<void>((resolve) => {
    const o = createDialog(title, message);
    o.dialog.setAttribute('type', 'warning');
    o.dialog.bus.on('closed', resolve);
  });
};

export const danger = (message: string, title: string = 'Danger') => {
  return new Promise<void>((resolve) => {
    const o = createDialog(title, message);
    o.dialog.setAttribute('type', 'danger');
    o.dialog.bus.on('closed', resolve);
  });
};
