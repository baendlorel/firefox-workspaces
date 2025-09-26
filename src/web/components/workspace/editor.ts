import { Consts, WORKSPACE_COLORS } from '@/lib/consts.js';
import { btn, div, h } from '@/lib/dom.js';
import { EventBus } from '@web/event-bus.js';
import { createDialog } from '../dialog.js';

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  let editingWorkspace: Workspace | null = null;

  // # body
  const inputName = h('input', { type: 'text', id: 'workspace-name' });
  const colorOptions = WORKSPACE_COLORS.map((color) => {
    const el = div('color-option');
    el.style.backgroundColor = color;
    el.dataset.color = color;
    el.addEventListener('click', () => {
      colorPicker.dataset.color = color;
      bus.emit('select-color', color);
    });
    return el;
  });
  const colorPicker = h('input', 'color-picker', colorOptions);
  const body = [
    div('form-group', [h('label', { for: 'workspace-name' }, 'Workspace Name'), inputName]),
    div('form-group', [h('label', '', 'Workspace Color'), colorPicker]),
  ];

  // # footer
  const cancelBtn = btn({ class: 'btn btn-secondary', type: 'button' }, 'Cancel');
  const saveBtn = btn({ class: 'btn btn-primary', type: 'button' }, 'Save');
  const footer = [cancelBtn, saveBtn];

  const { dialog, closeBtn } = createDialog('Workspace', body, footer);
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
    } else {
      inputName.value = '';
      selectColor(Consts.DefaultColor);
    }

    dialog.bus.emit('show');
    dialog.bus.on('shown', () => inputName.focus());
  });

  bus.on('close-editor', close);

  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  saveBtn.addEventListener('click', () => {
    // validate
    const name = inputName.value.trim();
    if (!name) {
      alert('Please enter a group name');
      return;
    }

    // emit save event
    bus.emit('save', {
      name: inputName.value,
      color: colorPicker.dataset.color as HexColor,
    });

    // close the modal
    close();
  });

  return { el: dialog, getEditingWorkspace: () => editingWorkspace };
};
