import { EventBus } from 'minimal-event-bus';
import { i } from '@/lib/polyfilled-api.js';

import { WORKSPACE_COLORS } from '@/lib/consts.js';
import { btn, div, h } from '@/lib/dom.js';
import { Color } from '@/lib/color.js';
import { $randItem } from '@/lib/utils.js';
import { createWorkspaceTab } from '@/lib/workspace.js';

import { confirmation, danger, info } from '@comp/dialog/alerts.js';
import { createDialog } from '@comp/dialog/index.js';
import colorPicker from '@comp/color/index.js';
import popupService from '@web/popup.service.js';

export default (bus: EventBus<WorkspaceEditorEventMap>): HTMLDialogElement => {
  let editingWorkspace: Workspace | null = null;
  let currentTabs: WorkspaceTab[] = [];

  // # body
  const inputName = h('input', { id: 'workspace-name', type: 'text' });
  const randomNameBtn = btn(
    { class: 'btn btn-primary ms-2', title: i('button.generate-random-name') },
    i('button.random')
  );
  const colorSelectorLabel = h('label', { for: 'workspace-color' }, i('workspace.field.color'));
  const colorSelector = colorPicker('workspace-color');

  const deleteBtn = btn(
    { class: 'btn btn-danger', title: i('button.delete-workspace') },
    i('button.delete')
  );
  deleteBtn.title = i('button.delete-workspace');

  const body = [
    div('form-group form-group-with-btn', [
      h('label', { for: 'workspace-name' }, i('workspace.field.name')),
      inputName,
      randomNameBtn,
    ]),
    div('form-group', [colorSelectorLabel, colorSelector]),
    deleteBtn,
  ];

  // # footer
  const cancelBtn = btn({ class: 'btn btn-secondary', type: 'button' }, i('button.cancel'));
  const saveBtn = btn({ class: 'btn btn-primary ms-2', type: 'button' }, i('button.save'));
  cancelBtn.title = i('button.cancel-and-close');
  saveBtn.title = i('button.save-workspace');

  const footer = [cancelBtn, saveBtn];

  // # Editor dialog
  const { dialog, closeBtn, setTitle } = createDialog(i('workspace.title'), body, footer);
  dialog.backdropClosable = true;
  dialog.escClosable = true;

  // # define handlers
  const close = () => {
    editingWorkspace = null;
    dialog.bus.emit('close');
  };

  // # register events
  bus.on('edit', (workspace: Workspace | null = null, tabs: browser.tabs.Tab[] = []) => {
    editingWorkspace = workspace;
    currentTabs = tabs // & ensure that tab.id is valid, or createWorkspaceTab will throw
      .filter((tab) => Number.isSafeInteger(tab.id) && tab.id !== browser.tabs.TAB_ID_NONE)
      .map(createWorkspaceTab);

    if (workspace) {
      inputName.value = workspace.name;
      colorSelector.value = workspace.color;
      setTitle(i('dialog.workspace.edit'));
      deleteBtn.style.display = '';
    } else {
      inputName.value = '';
      setTitle(tabs.length > 0 ? i('dialog.workspace.new-with-tabs') : i('workspace.new'));
      // randomly pick a color
      colorSelector.value = $randItem(WORKSPACE_COLORS);
      deleteBtn.style.display = 'none';
    }

    dialog.bus.emit('show');
    dialog.bus.on('shown', () => inputName.focus());
  });

  randomNameBtn.addEventListener('click', () => {
    const part1 = $randItem(i('workspace.random-name.part1').split(','));
    const part2 = $randItem(i('workspace.random-name.part2').split(','));
    inputName.value = part1 + part2;
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

    await popupService.save({
      id: editingWorkspace === null ? null : editingWorkspace.id,
      name: name,
      color: colorSelector.value,
      tabs: currentTabs,
    });

    // use latest data to render the list
    bus.emit('render-list');

    close();
  });

  deleteBtn.addEventListener('click', async () => {
    if (!editingWorkspace) {
      danger('No workspace selected to delete.');
      return;
    }

    const yes = await confirmation(i('message.confirm.delete-workspace', editingWorkspace.name));
    if (!yes) {
      return;
    }

    await popupService.delete(editingWorkspace);

    close();
  });

  return dialog;
};
