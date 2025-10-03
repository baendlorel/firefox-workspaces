import { Theme } from '@/lib/consts.js';
import { i, $lget } from '@/lib/ext-apis.js';
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
    radio('theme', Theme.Auto, i('autoSystem')),
    radio('theme', Theme.Light, i('light')),
    radio('theme', Theme.Dark, i('dark')),
  ]);

  const form = div('form-group', [h('label', { for: 'theme' }, i('theme')), themeSelect]);
  const resetBtn = btn('btn btn-secondary', i('reset'));
  const saveBtn = btn('btn btn-primary ms-2', i('save'));

  const { dialog, closeBtn } = createDialog(i('settings'), [form], [resetBtn, saveBtn]);
  dialog.setAttribute('aria-label', i('firefoxWorkspacesSettings'));
  closeBtn.title = i('closeSettingsDialog');

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
    const yes = await confirmation(i('resetSettings'), i('areYouSure'));
    if (yes) {
      selectTheme(Theme.Auto);
      applyTheme('auto');
    }
  });

  // # load settings for editing
  dialog.bus.on('show', async () => {
    const { settings } = await $lget('settings');
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
