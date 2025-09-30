import { EventBus } from 'minimal-event-bus';
import { RANDOM_NAME_PART1, RANDOM_NAME_PART2, WORKSPACE_COLORS } from '@/lib/consts.js';
import { btn, div, h } from '@/lib/dom.js';
import { $randInt } from '@/lib/utils.js';
import { Workspace } from '@/lib/workspace.js';

import { createDialog } from '../components/dialog/index.js';
import { confirmation, danger, info } from '../components/dialog/alerts.js';
import colorPicker from '../components/color/index.js';

export default (bus: EventBus<WorkspaceEditorEventMap>): HTMLDialogElement => {
  let editingWorkspace: Workspace | null = null;

  // # body
  const inputName = h('input', { id: 'workspace-name', type: 'text' });
  const randomNameBtn = btn(
    { class: 'btn btn-primary ms-2', title: 'Generate a random name' },
    'Random'
  );
  const colorSelectorLabel = h('label', { for: 'workspace-color' }, 'Color');
  const colorSelector = colorPicker('workspace-color');

  const deleteBtn = btn({ class: 'btn btn-danger mt-4 mb-3', type: 'button' }, 'Delete Workspace');
  deleteBtn.title = 'Delete this workspace';
  const body = [
    div('form-group form-group-with-btn', [
      h('label', { for: 'workspace-name' }, 'Name'),
      inputName,
      randomNameBtn,
    ]),
    div('form-group', [colorSelectorLabel, colorSelector]),
    deleteBtn,
  ];

  // # footer
  const cancelBtn = btn({ class: 'btn btn-secondary', type: 'button' }, 'Cancel');
  const saveBtn = btn({ class: 'btn btn-primary ms-2', type: 'button' }, 'Save');
  cancelBtn.title = 'Cancel and close dialog';
  saveBtn.title = 'Save workspace';

  const footer = [cancelBtn, saveBtn];

  // # Editor dialog
  const { dialog, closeBtn, setTitle } = createDialog('Workspace', body, footer);
  dialog.backdropClosable = true;
  dialog.escClosable = true;

  // # define handlers
  const close = () => {
    dialog.bus.emit('close');
    dialog.bus.on('closed', () => (editingWorkspace = null));
  };

  // # register events
  bus.on('edit', (workspace: Workspace | null = null) => {
    editingWorkspace = workspace;

    if (workspace) {
      inputName.value = workspace.name;
      colorSelector.value = workspace.color;
      setTitle('Edit Workspace');
      deleteBtn.style.display = 'block';
    } else {
      inputName.value = '';
      setTitle('New Workspace');
      deleteBtn.style.display = 'none';
      // randomly pick a color
      colorSelector.value = WORKSPACE_COLORS[$randInt(WORKSPACE_COLORS.length)];
    }

    dialog.bus.emit('show');
    dialog.bus.on('shown', () => inputName.focus());
  });

  bus.on('close-editor', close);

  randomNameBtn.addEventListener('click', () => {
    const part1 = RANDOM_NAME_PART1[$randInt(RANDOM_NAME_PART1.length)];
    const part2 = RANDOM_NAME_PART2[$randInt(RANDOM_NAME_PART2.length)];
    inputName.value = `${part1} ${part2}`;
  });

  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  saveBtn.addEventListener('click', () => {
    // validate
    const name = inputName.value.trim();
    if (!name) {
      info('Please enter a group name');
      return;
    }

    // emit save event
    bus.emit('save', {
      id: editingWorkspace === null ? undefined : editingWorkspace.id,
      name: inputName.value,
      color: colorSelector.value,
    });

    // close the modal
    close();
  });

  deleteBtn.addEventListener('click', async () => {
    if (!editingWorkspace) {
      danger('No workspace selected to delete.');
      return;
    }

    const yes = await confirmation(`Are you sure you want to delete "${editingWorkspace.name}"?`);
    if (!yes) {
      return;
    }
    bus.emit('delete', editingWorkspace as Workspace);
    close();
  });

  return dialog;
};
