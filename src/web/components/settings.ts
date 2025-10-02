import { Theme } from '@/lib/consts.js';
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
export default () => {
  // Theme selection
  const themeSelect = div('flex gap-2', [
    radio('theme', Theme.Auto, 'Auto (System)'),
    radio('theme', Theme.Light, 'Light'),
    radio('theme', Theme.Dark, 'Dark'),
  ]);

  const form = div('form-group', [h('label', { for: 'theme' }, 'Theme'), themeSelect]);
  const resetBtn = btn('btn btn-secondary', 'Reset');
  const saveBtn = btn('btn btn-primary ms-2', 'Save');

  const { dialog, closeBtn } = createDialog('Settings', [form], [resetBtn, saveBtn]);
  dialog.setAttribute('aria-label', 'Firefox Workspaces Settings');
  closeBtn.title = 'Close settings dialog';

  // # register events
  const selectTheme = (value: Theme) => {
    for (let i = 0; i < themeSelect.children.length; i++) {
      const c = themeSelect.children[i];
      if (c instanceof HTMLInputElement && c.type === 'radio') {
        c.checked = c.value === value;
      }
    }
  };

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
      selectTheme(Theme.Auto);
      applyTheme('auto');
    }
  });

  // todo 是否不需要把事件传来传去了？
  // # load settings for editing
  dialog.bus.on('show', async () => {
    const settings = (await browser.storage.local.get('settings')) as WorkspaceSettings;
    selectTheme(settings.theme);
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
