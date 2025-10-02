import { confirmation } from './dialog/alerts.js';
import { createDialog } from './dialog/index.js';
import { h, div, btn } from '@/lib/dom.js';

const radio = (name: string, value: string, label: string) =>
  div('radio', [
    h('input', { type: 'radio', name, value, id: `${name}-${value}` }),
    h('label', { for: `${name}-${value}` }, label),
  ]);

/**
 * Settings dialog component
 * Provides various workspace management settings
 */
export default (): HTMLDialogElement => {
  // Theme selection
  const themeSelect = div('', [
    radio('theme', 'auto', 'Auto (System)'),
    radio('theme', 'light', 'Light'),
    radio('theme', 'dark', 'Dark'),
  ]);

  const form = div('form-group', [h('label', { for: 'theme' }, 'Theme'), themeSelect]);
  const saveBtn = btn('btn btn-primary', 'Save Settings');
  const resetBtn = btn('btn btn-secondary', 'Reset');

  const { dialog, closeBtn } = createDialog('Settings', [form], [resetBtn, saveBtn]);
  dialog.setAttribute('aria-label', 'Firefox Workspaces Settings');
  closeBtn.title = 'Close settings dialog';

  // Event handlers
  saveBtn.addEventListener('click', () => {
    const theme =
      (document.querySelector('input[name="theme"]:checked') as HTMLInputElement)?.value || 'auto';

    // Apply theme immediately
    applyTheme(theme);

    dialog.bus.emit('close');
  });

  resetBtn.addEventListener('click', async () => {
    const yes = await confirmation('Reset Settings', 'Are you sure?');
    if (yes) {
      // Reset form values
      for (let i = 0; i < themeSelect.children.length; i++) {
        const c = themeSelect.children[i];
        if (c instanceof HTMLInputElement && c.type === 'radio') {
          c.checked = c.value === 'auto';
        }
      }

      applyTheme('auto');
    }
  });

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
