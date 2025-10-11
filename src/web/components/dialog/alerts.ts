import { i } from '@/lib/polyfilled-api.js';

import { btn, div, h } from '@/lib/dom.js';
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
    const passwordInput = h('input', { type: 'password' });
    const forgotBtn = btn(
      { class: 'btn btn-link', style: 'width:64px' },
      i('button.password-hint')
    );
    const password = div('form-group', [
      h('label', { for: 'workspace-password', required: '' }, i('editor.field.password')),
      div('gap-flex', [passwordInput, forgotBtn]),
    ]);

    const bodyContent = message ? [h('p', '', message), password] : [password];

    const cancelBtn = btn('btn btn-secondary', i('button.cancel'));
    const submitBtn = btn('btn btn-primary', i('button.yes'));

    const dialog = createDialog(i('dialog.unlock.title', workspace.name), bodyContent, [
      div({ class: 'gap-flex', style: 'margin-left:auto; width: fit-content;' }, [
        cancelBtn,
        submitBtn,
      ]),
    ]).dialog;
    dialog.backdropClosable = false;
    dialog.escClosable = true;

    // Handle forgot password button
    forgotBtn.onclick = (e) => {
      e.preventDefault();
      if (workspace.passpeek) {
        info(i('dialog.password-hint.message', workspace.passpeek));
      } else {
        info(i('dialog.password-hint.no-hint'));
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
