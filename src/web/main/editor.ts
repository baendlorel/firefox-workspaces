import { EventBus } from 'minimal-event-bus';
import { i } from '@/lib/polyfilled-api.js';

import { WORKSPACE_COLORS } from '@/lib/consts.js';
import { btn, div, h } from '@/lib/dom.js';
import { Color } from '@/lib/color.js';
import { $randItem, $sha256 } from '@/lib/utils.js';
import { createWorkspaceTab } from '@/lib/workspace.js';

import { confirmation, danger, info } from '@comp/dialog/alerts.js';
import { createDialog } from '@comp/dialog/index.js';
import colorPicker from '@comp/color/index.js';
import popupService from '@web/popup.service.js';

export default (bus: EventBus<WorkspaceEditorEventMap>): HTMLDialogElement => {
  let current: Workspace | null = null;
  let currentTabs: WorkspaceTab[] = [];

  // # body
  const inputName = h('input', { id: 'workspace-name', type: 'text' });
  const randomNameBtn = btn('btn btn-primary', i('editor.random-name'));
  const inputNameDiv = div('gap-flex', [inputName, randomNameBtn]);
  const colorSelector = colorPicker('workspace-color');

  // Password fields
  const inputOldPassword = h('input', {
    id: 'workspace-old-password',
    type: 'password',
    placeholder: i('editor.password.placeholder-old'),
  });
  const forgotPasswordBtn = btn('btn btn-secondary', i('button.peek-password'));

  const inputPassword = h('input', {
    id: 'workspace-password',
    type: 'password',
    placeholder: i('editor.password.placeholder'),
  });
  const inputPasswordConfirm = h('input', {
    id: 'workspace-password-confirm',
    type: 'password',
    placeholder: i('editor.password.placeholder-confirm'),
  });
  const passwordGroup = div('form-group', [
    h('label', { for: 'workspace-password' }, i('editor.field.password')),
    inputPassword,
    inputPasswordConfirm,
  ]);
  const oldPasswordGroup = div('form-group form-group-with-btn', [
    h('label', { for: 'workspace-old-password' }, i('editor.field.old-password')),
    div('gap-flex', [inputOldPassword, forgotPasswordBtn]),
  ]);

  const body = [
    div('form-group form-group-with-btn', [
      h('label', { for: 'workspace-name', required: '' }, i('editor.field.name')),
      inputNameDiv,
    ]),
    div('form-group', [
      h('label', { for: 'workspace-color', required: '' }, i('editor.field.color')),
      colorSelector,
    ]),
    oldPasswordGroup,
    passwordGroup,
  ];

  // # footer
  const deleteBtn = btn('btn btn-danger', i('editor.delete'));
  const cancelBtn = btn('btn btn-secondary', i('button.cancel'));
  const saveBtn = btn('btn btn-primary', i('button.save'));
  const footer = div({ class: 'gap-flex', style: 'margin-left:auto; width: fit-content;' }, [
    deleteBtn,
    cancelBtn,
    saveBtn,
  ]);

  // # Editor dialog
  const { dialog, closeBtn, setTitle } = createDialog(i('workspace.title'), body, [footer]);
  dialog.backdropClosable = true;
  dialog.escClosable = true;

  // # define handlers
  const close = () => {
    current = null;
    dialog.bus.emit('close');
  };

  // # register events
  bus.on('edit', (workspace: Workspace | null = null, tabs: browser.tabs.Tab[] = []) => {
    current = workspace;
    currentTabs = tabs // & ensure that tab.id is valid, or createWorkspaceTab will throw
      .filter((tab) => Number.isSafeInteger(tab.id) && tab.id !== browser.tabs.TAB_ID_NONE)
      .map(createWorkspaceTab);

    if (workspace) {
      inputName.value = workspace.name;
      colorSelector.value = workspace.color;
      setTitle(i('dialog.workspace.edit'));
      deleteBtn.style.display = '';

      // Always show old password field to allow users to set/change/remove password
      // Only hide if workspace has no password (empty string)
      if (workspace.password !== '') {
        oldPasswordGroup.style.display = '';
      } else {
        oldPasswordGroup.style.display = 'none';
      }
    } else {
      inputName.value = '';
      setTitle(tabs.length > 0 ? i('dialog.workspace.new-with-tabs') : i('workspace.new'));
      // randomly pick a color
      colorSelector.value = $randItem(WORKSPACE_COLORS);
      deleteBtn.style.display = 'none';
      oldPasswordGroup.style.display = 'none';
    }

    // Reset password fields
    inputOldPassword.value = '';
    inputPassword.value = '';
    inputPasswordConfirm.value = '';

    dialog.bus.emit('show');
    dialog.bus.on('shown', () => inputName.focus());
  });

  randomNameBtn.addEventListener('click', () => {
    const part1 = $randItem(i('editor.random-name.part1').split(','));
    const part2 = $randItem(i('editor.random-name.part2').split(','));
    inputName.value = part1 + part2;
  });

  forgotPasswordBtn.addEventListener('click', () => {
    if (current && current.passpeek) {
      info(
        i('dialog.password-hint.message', { peek: current.passpeek }),
        i('dialog.password-hint.title')
      );
    } else {
      info(i('dialog.password-hint.no-hint'), i('dialog.password-hint.title'));
    }
  });

  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  saveBtn.addEventListener('click', async () => {
    // validate
    const name = inputName.value.trim();
    if (!name) {
      info(i('message.validation.enter-group-name'));
      return;
    }
    if (!Color.valid(colorSelector.value)) {
      info('Color must be like #RRGGBB or #RRGGBBAA');
      return;
    }

    // Password validation
    const oldPassword = inputOldPassword.value;
    const newPassword = inputPassword.value.trim();
    const confirmPassword = inputPasswordConfirm.value.trim();

    let passwordHash = '';
    let passpeek = '';

    // If editing existing workspace with password (not empty string)
    if (current && current.password !== '') {
      // Check if user wants to change password
      if (newPassword || oldPassword) {
        // Verify old password
        const oldPasswordHash = await $sha256(oldPassword);
        if (oldPasswordHash !== current.password) {
          info(i('message.validation.old-password-incorrect'));
          return;
        }

        // If new password provided, validate it
        if (newPassword) {
          if (newPassword.length < 6) {
            info(i('message.validation.password-too-short'));
            return;
          }
          if (newPassword !== confirmPassword) {
            info(i('message.validation.passwords-not-match'));
            return;
          }
          passwordHash = await $sha256(newPassword);
          passpeek = newPassword.substring(0, 3);
        }
        // else: user wants to remove password (old password verified, new password empty)
      } else {
        // Keep existing password if no changes
        passwordHash = current.password;
        passpeek = current.passpeek;
      }
    } else {
      // New workspace or existing workspace without password
      if (newPassword) {
        if (newPassword.length < 6) {
          info(i('message.validation.password-too-short'));
          return;
        }
        if (newPassword !== confirmPassword) {
          info(i('message.validation.passwords-not-match'));
          return;
        }
        passwordHash = await $sha256(newPassword);
        passpeek = newPassword.substring(0, 3);
      }
    }

    await popupService.save({
      id: current === null ? null : current.id,
      name: name,
      color: colorSelector.value,
      tabs: currentTabs,
      password: passwordHash,
      passpeek: passpeek,
    });

    // use latest data to render the list
    bus.emit('render-list');

    close();
  });

  deleteBtn.addEventListener('click', async () => {
    if (!current) {
      danger('No workspace selected to delete.');
      return;
    }

    const yes = await confirmation(i('message.confirm.delete-workspace', { name: current.name }));
    if (!yes) {
      return;
    }

    await popupService.delete(current);

    close();
  });

  return dialog;
};
