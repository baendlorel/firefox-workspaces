import { createDialog } from './index.js';

export default (title: string, message: string) => {
  return new Promise<void>((resolve) =>
    createDialog(title, message).dialog.bus.on('closed', resolve)
  );
};
