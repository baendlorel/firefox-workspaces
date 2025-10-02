import { EventBus } from 'minimal-event-bus';
import { RANDOM_NAME_EN_A, RANDOM_NAME_EN_B, WORKSPACE_COLORS } from '@/lib/consts.js';
import { btn, div, h, svg } from '@/lib/dom.js';
import { $randInt } from '@/lib/utils.js';
import { i } from '@/lib/ext-apis.js';
import { Workspace } from '@/lib/workspace.js';
import { WorkspaceTab } from '@/lib/workspace-tab.js';

import { confirmation, danger, info } from '@web/components/dialog/alerts.js';
import { createDialog } from '@web/components/dialog/index.js';
import colorPicker from '@web/components/color/index.js';
import trashSvg from '@web/assets/trash.svg?raw';
import popupService from '@web/popup.service.js';

export default (bus: EventBus<WorkspaceEditorEventMap>): HTMLDialogElement => {
  let editingWorkspace: Workspace | null = null;
  let currentTabs: WorkspaceTab[] = [];

  // # body
  const inputName = h('input', { id: 'workspace-name', type: 'text' });
  const randomNameBtn = btn(
    { class: 'btn btn-primary ms-2', title: i('generateRandomName') },
    i('random')
  );
  const colorSelectorLabel = h('label', { for: 'workspace-color' }, i('color'));
  const colorSelector = colorPicker('workspace-color');

  const deleteBtn = btn('btn btn-danger btn-with-icon', [
    svg(trashSvg, 'var(--light)', 14),
    i('delete'),
  ]);
  deleteBtn.title = i('deleteWorkspace');

  const body = [
    div('form-group form-group-with-btn', [
      h('label', { for: 'workspace-name' }, i('name')),
      inputName,
      randomNameBtn,
    ]),
    div('form-group', [colorSelectorLabel, colorSelector]),
    deleteBtn,
  ];

  // # footer
  const cancelBtn = btn({ class: 'btn btn-secondary', type: 'button' }, i('cancel'));
  const saveBtn = btn({ class: 'btn btn-primary ms-2', type: 'button' }, i('save'));
  cancelBtn.title = i('cancelAndClose');
  saveBtn.title = i('saveWorkspace');

  const footer = [cancelBtn, saveBtn];

  // # Editor dialog
  const { dialog, closeBtn, setTitle } = createDialog(i('workspace'), body, footer);
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
    currentTabs = tabs.map(WorkspaceTab.from);

    if (workspace) {
      inputName.value = workspace.name;
      colorSelector.value = workspace.color;
      setTitle(i('editWorkspace'));
      deleteBtn.style.display = '';
    } else {
      inputName.value = '';
      setTitle(tabs.length > 0 ? i('newWorkspaceWithTabs') : i('newWorkspace'));
      // randomly pick a color
      colorSelector.value = WORKSPACE_COLORS[$randInt(WORKSPACE_COLORS.length)];
      deleteBtn.style.display = 'none';
    }

    dialog.bus.emit('show');
    dialog.bus.on('shown', () => inputName.focus());
  });

  randomNameBtn.addEventListener('click', () => {
    const part1 = RANDOM_NAME_EN_A[$randInt(RANDOM_NAME_EN_A.length)];
    const part2 = RANDOM_NAME_EN_B[$randInt(RANDOM_NAME_EN_B.length)];
    inputName.value = `${part1} ${part2}`;
  });

  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  saveBtn.addEventListener('click', async () => {
    // validate
    const name = inputName.value.trim();
    if (!name) {
      info(i('pleaseEnterGroupName'));
      return;
    }
    if (!/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(colorSelector.value)) {
      info('Color must be like #RRGGBB or #RRGGBBAA');
      return;
    }

    await popupService.save({
      id: editingWorkspace === null ? null : editingWorkspace.id,
      name: name,
      color: colorSelector.value,
      tabs: currentTabs,
    });

    await popupService.load();

    // use latest data to render the list
    bus.emit('render-list', popupService.workspaces, popupService.activated);

    close();
  });

  deleteBtn.addEventListener('click', async () => {
    if (!editingWorkspace) {
      danger('No workspace selected to delete.');
      return;
    }

    const yes = await confirmation(i('confirmDeleteWorkspace', editingWorkspace.name));
    if (!yes) {
      return;
    }
    await popupService.delete(editingWorkspace);
    close();
  });

  return dialog;
};
