import { i } from '@/lib/polyfilled-api.js';

import { btn, h } from '@/lib/dom.js';
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
    const yesBtn = btn('btn btn-primary', i('button.yes'));
    const noBtn = btn('btn btn-secondary', i('button.no'));
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

/**
 * Prompt for password input
 */
export const passwordPrompt = (workspace: Workspace, message?: string) => {
  return new Promise<string | null>((resolve) => {
    const passwordInput = h('input', {
      type: 'password',
      placeholder: i('editor.password.placeholder-unlock'),
      class: 'form-control',
      style: 'margin-top: 10px; width: 100%;',
    });

    const forgotBtn = btn('btn btn-link', i('button.forgot-password'));
    forgotBtn.style.fontSize = '12px';
    forgotBtn.style.padding = '4px 0';
    forgotBtn.style.marginTop = '4px';

    const bodyContent = message
      ? [h('p', '', message), passwordInput, forgotBtn]
      : [passwordInput, forgotBtn];

    const cancelBtn = btn('btn btn-secondary', i('button.cancel'));
    const submitBtn = btn('btn btn-primary', i('button.save'));

    const dialog = createDialog(i('dialog.unlock.title', workspace.name), bodyContent, [
      cancelBtn,
      submitBtn,
    ]).dialog;
    dialog.backdropClosable = false;
    dialog.escClosable = true;

    // Handle forgot password button
    forgotBtn.onclick = (e) => {
      e.preventDefault();
      if (workspace.passpeek) {
        info(
          i('dialog.password-hint.message', workspace.passpeek),
          i('dialog.password-hint.title')
        );
      } else {
        info(i('dialog.password-hint.no-hint'), i('dialog.password-hint.title'));
      }
    };

    submitBtn.onclick = () => {
      const password = passwordInput.value;
      dialog.bus.emit('close');
      dialog.bus.on('closed', () => resolve(password));
    };

    cancelBtn.onclick = () => {
      dialog.bus.emit('close');
      dialog.bus.on('closed', () => resolve(null));
    };

    document.body.appendChild(dialog);
    dialog.bus.emit('show');
    dialog.bus.on('shown', () => passwordInput.focus());
  });
};
