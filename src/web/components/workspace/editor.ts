import { EventBus } from 'minimal-event-bus';
import { Consts, RANDOM_NAME_PART1, RANDOM_NAME_PART2, WORKSPACE_COLORS } from '@/lib/consts.js';
import { btn, div, h } from '@/lib/dom.js';

import { createDialog } from '../dialog/index.js';
import { confirmation, danger, info } from '../dialog/alerts.js';
import { $randInt } from '@/lib/utils.js';

export default (bus: EventBus<WorkspaceEditorEventMap>): HTMLDialogElement => {
  let editingWorkspace: Workspace | null = null;

  // # body
  const inputName = h('input', { id: 'workspace-name', type: 'text' });
  const randomName = btn('btn btn-primary ms-2', 'Random');
  randomName.title = 'Generate a random workspace name';
  const colorOptions = WORKSPACE_COLORS.map((color) => {
    const el = div('color-option');
    el.style.backgroundColor = color;
    el.dataset.color = color;
    el.addEventListener('click', () => {
      colorPicker.dataset.color = color;
      colorOptions.forEach((c) => c.classList.toggle('selected', c === el));
    });
    return el;
  });
  const colorPicker = div('color-picker', colorOptions);
  const deleteBtn = btn({ class: 'btn btn-danger mt-4 mb-3', type: 'button' }, 'Delete Workspace');
  deleteBtn.title = 'Delete this workspace';
  const body = [
    div('form-group form-group-with-btn', [
      h('label', { for: 'workspace-name' }, 'Name'),
      inputName,
      randomName,
    ]),
    div('form-group', [h('label', '', 'Color'), colorPicker]),
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

  const selectColor = (color: HexColor) => {
    // & No need to validate since the options are fixed
    // if (!/^#([0-9a-fA-F]{6})$/.test(color) && /^#([0-9a-fA-F]{8})$/.test(color)) {
    //   alert('Please select a valid 6/8-digit hex color code (e.g., #RRGGBB, #RRGGBBAA)');
    //   return;
    // }

    colorPicker.dataset.color = color;
    for (let i = 0; i < colorOptions.length; i++) {
      const option = colorOptions[i];
      option.classList.toggle('selected', option.dataset.color === color);
    }
  };

  // # register events

  bus.on('edit', (workspace: Workspace | null = null) => {
    editingWorkspace = workspace;

    if (workspace) {
      inputName.value = workspace.name;
      selectColor(workspace.color);
      setTitle('Edit Workspace');
      deleteBtn.style.display = 'block';
    } else {
      inputName.value = '';
      selectColor(Consts.DefaultColor);
      setTitle('New Workspace');
      deleteBtn.style.display = 'none';
    }

    dialog.bus.emit('show');
    dialog.bus.on('shown', () => inputName.focus());
  });

  bus.on('close-editor', close);

  randomName.addEventListener('click', () => {
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
      color: colorPicker.dataset.color as HexColor,
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
