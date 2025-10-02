import { createDialog } from './dialog/index.js';
import { h, div, btn } from '@/lib/dom.js';

/**
 * Settings dialog component
 * Provides various workspace management settings
 */
export default (): HTMLDialogElement => {
  // Auto-save settings
  const autoSaveCheckbox = h('input', {
    id: 'auto-save',
    type: 'checkbox',
  }) as HTMLInputElement;
  autoSaveCheckbox.checked = localStorage.getItem('ws-auto-save') !== 'false';

  // Theme selection
  const themeSelect = h('select', { id: 'theme' }, [
    h('option', { value: 'auto' }, 'Auto'),
    h('option', { value: 'light' }, 'Light'),
    h('option', { value: 'dark' }, 'Dark'),
  ]);
  themeSelect.value = localStorage.getItem('ws-theme') || 'auto';

  // Show tab count
  const showTabCountCheckbox = h('input', {
    id: 'show-tab-count',
    type: 'checkbox',
  }) as HTMLInputElement;
  showTabCountCheckbox.checked = localStorage.getItem('ws-show-tab-count') !== 'false';

  // Workspace limit
  const workspaceLimitInput = h('input', {
    id: 'workspace-limit',
    type: 'number',
    min: '1',
    max: '50',
    value: localStorage.getItem('ws-workspace-limit') || '20',
  });

  // Confirm before delete
  const confirmDeleteCheckbox = h('input', {
    id: 'confirm-delete',
    type: 'checkbox',
  }) as HTMLInputElement;
  confirmDeleteCheckbox.checked = localStorage.getItem('ws-confirm-delete') !== 'false';

  // Auto-backup frequency
  const backupFrequencySelect = h('select', { id: 'backup-frequency' }, [
    h('option', { value: 'never' }, 'Never'),
    h('option', { value: 'daily' }, 'Daily'),
    h('option', { value: 'weekly' }, 'Weekly'),
    h('option', { value: 'monthly' }, 'Monthly'),
  ]);
  backupFrequencySelect.value = localStorage.getItem('ws-backup-frequency') || 'weekly';

  const rawBody = [
    h('h3', '', 'Workspace Settings'),

    div('form-group', [
      h('label', { for: 'auto-save' }, 'Auto-save workspace changes'),
      autoSaveCheckbox,
    ]),

    div('form-group', [h('label', { for: 'theme' }, 'Theme'), themeSelect]),

    div('form-group', [
      h('label', { for: 'show-tab-count' }, 'Show tab count in workspace list'),
      showTabCountCheckbox,
    ]),

    div('form-group', [
      h('label', { for: 'workspace-limit' }, 'Maximum number of workspaces'),
      workspaceLimitInput,
    ]),

    div('form-group', [
      h('label', { for: 'confirm-delete' }, 'Confirm before deleting workspaces'),
      confirmDeleteCheckbox,
    ]),

    div('form-group', [
      h('label', { for: 'backup-frequency' }, 'Auto-backup frequency'),
      backupFrequencySelect,
    ]),
  ];

  const saveBtn = btn({ class: 'btn btn-primary' }, 'Save Settings');
  const resetBtn = btn({ class: 'btn btn-secondary' }, 'Reset to Defaults');

  const { dialog, body, closeBtn } = createDialog('Settings', rawBody, [resetBtn, saveBtn]);

  // Event handlers
  saveBtn.addEventListener('click', () => {
    localStorage.setItem('ws-auto-save', autoSaveCheckbox.checked.toString());
    localStorage.setItem('ws-theme', themeSelect.value);
    localStorage.setItem('ws-show-tab-count', showTabCountCheckbox.checked.toString());
    localStorage.setItem('ws-workspace-limit', workspaceLimitInput.value);
    localStorage.setItem('ws-confirm-delete', confirmDeleteCheckbox.checked.toString());
    localStorage.setItem('ws-backup-frequency', backupFrequencySelect.value);

    // Apply theme immediately
    applyTheme(themeSelect.value);

    dialog.bus.emit('close');
  });

  resetBtn.addEventListener('click', () => {
    if (confirm('Reset all settings to defaults?')) {
      localStorage.removeItem('ws-auto-save');
      localStorage.removeItem('ws-theme');
      localStorage.removeItem('ws-show-tab-count');
      localStorage.removeItem('ws-workspace-limit');
      localStorage.removeItem('ws-confirm-delete');
      localStorage.removeItem('ws-backup-frequency');

      // Reset form values
      autoSaveCheckbox.checked = true;
      themeSelect.value = 'auto';
      showTabCountCheckbox.checked = true;
      workspaceLimitInput.value = '20';
      confirmDeleteCheckbox.checked = true;
      backupFrequencySelect.value = 'weekly';

      applyTheme('auto');
    }
  });

  dialog.setAttribute('aria-label', 'Firefox Workspaces Settings');
  closeBtn.title = 'Close settings dialog';

  document.body.appendChild(dialog);
  return dialog;
};

/**
 * Apply the selected theme
 */
function applyTheme(theme: string) {
  document.documentElement.className = '';

  if (theme === 'light') {
    document.documentElement.classList.add('light-theme');
  } else if (theme === 'dark') {
    document.documentElement.classList.add('dark-theme');
  } else {
    // Auto theme - use system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.add('light-theme');
    }
  }
}

// Initialize theme on load
const savedTheme = localStorage.getItem('ws-theme') || 'auto';
applyTheme(savedTheme);
