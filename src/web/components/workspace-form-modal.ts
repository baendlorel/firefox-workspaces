import { WORKSPACE_COLORS } from '@/lib/consts.js';
import { btn, div, h } from '@/lib/dom.js';

export default (handlers: {
  onCancel: () => void;
  onSave: () => void;
  onSelectColor: (color: string) => void;
}) => {
  const dialog = h('dialog', 'dialog-container');
  const content = div('dialog-content');

  const closeBtn = btn({ class: 'dialog-close-btn', type: 'button' });
  const header = div('dialog-header', [h('h2', '', 'Create New Workspace'), closeBtn]);

  // form
  const inputName = h('input', { type: 'text', id: 'workspace-name', name: 'workspace-name' });
  const colorPicker = h(
    'input',
    'color-picker',
    WORKSPACE_COLORS.map((color) => {
      const el = div('color-option');
      el.style.backgroundColor = color;
      el.dataset.color = color;
      el.addEventListener('click', () => {
        colorPicker.dataset.color = color;
        handlers.onSelectColor(color);
      });
      return el;
    })
  );

  const cancelBtn = btn({ class: 'btn btn-secondary', type: 'button' }, 'Cancel');
  const saveBtn = btn({ class: 'btn btn-primary', type: 'button' }, 'Save');
  cancelBtn.addEventListener('click', handlers.onCancel);
  saveBtn.addEventListener('click', handlers.onSave);

  const form = h('form', '', [
    div('form-group', [h('label', { for: 'workspace-name' }, 'Workspace Name'), inputName]),
    div('form-group', [h('label', '', 'Workspace Color'), colorPicker]),
    div('dialog-actions', [cancelBtn, saveBtn]),
  ]);

  dialog.appendChild(content);
  content.append(header, form);

  /**
   * Get input data of the form
   */
  const collect = () => {
    return {
      name: inputName.value,
      color: colorPicker.dataset.color,
    };
  };

  return {
    dialog,
    closeBtn,
    cancelBtn,
    saveBtn,
    collect,
  };
};
