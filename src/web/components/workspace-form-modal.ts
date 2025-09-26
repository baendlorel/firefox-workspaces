import { Consts, WORKSPACE_COLORS } from '@/lib/consts.js';
import { btn, div, h } from '@/lib/dom.js';

export default (handlers: WorkspaceModalArgs) => {
  const { onCancel, onSave, onSelectColor } = handlers;

  let editingWorkspace: Workspace | null = null;

  const modal = h('dialog', 'dialog-container');
  const content = div('dialog-content');

  // header
  const closeBtn = btn({ class: 'dialog-close-btn', type: 'button' });
  const title = h('h2', '', 'Create New Workspace');
  const header = div('dialog-header', [title, closeBtn]);

  // form
  const inputName = h('input', { type: 'text', id: 'workspace-name', name: 'workspace-name' });
  const colorOptions = WORKSPACE_COLORS.map((color) => {
    const el = div('color-option');
    el.style.backgroundColor = color;
    el.dataset.color = color;
    el.addEventListener('click', () => {
      colorPicker.dataset.color = color;
      onSelectColor(color);
    });
    return el;
  });
  const colorPicker = h('input', 'color-picker', colorOptions);

  const cancelBtn = btn({ class: 'btn btn-secondary', type: 'button' }, 'Cancel');
  const saveBtn = btn({ class: 'btn btn-primary', type: 'button' }, 'Save');
  const form = h('form', '', [
    div('form-group', [h('label', { for: 'workspace-name' }, 'Workspace Name'), inputName]),
    div('form-group', [h('label', '', 'Workspace Color'), colorPicker]),
    div('dialog-actions', [cancelBtn, saveBtn]),
  ]);

  modal.appendChild(content);
  content.append(header, form);

  // # register events
  const edit = (workspace: Workspace | null = null) => {
    editingWorkspace = workspace;

    if (workspace) {
      title.textContent = 'Edit Workspaces';
      inputName.value = workspace.name;
      selectColor(workspace.color);
    } else {
      title.textContent = 'Create New Workspaces';
      inputName.value = '';
      selectColor(Consts.DefaultColor);
    }

    // Remove any existing animation classes
    modal.classList.remove('animate-in', 'animate-out');

    modal.showModal();

    // Add entrance animation
    requestAnimationFrame(() => {
      modal.classList.add('animate-in');
    });

    inputName.focus();
  };

  const close = () => {
    // Add exit animation
    modal.classList.remove('animate-in');
    modal.classList.add('animate-out');

    // Close after animation completes
    setTimeout(() => {
      modal.close();
      modal.classList.remove('animate-out');
      editingWorkspace = null;
      onCancel();
    }, 250); // Match the animation duration
  };

  const selectColor = (color: HexColor) => {
    // & No need to validate for the options are fixed
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

  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  saveBtn.addEventListener('click', () => {
    onSave({
      name: inputName.value,
      color: String(colorPicker.dataset.color),
    });
    close();
  });

  // Close dialog when press Esc key
  modal.addEventListener('keydown', (e) => e.key === 'Escape' && close());

  // Close dialog when clicking on backdrop (outside the dialog content)
  modal.addEventListener('click', (e) => e.target === modal && close());

  return {
    modal,
    edit,
    close,
    getEditingWorkspace() {
      return editingWorkspace;
    },
  };
};
