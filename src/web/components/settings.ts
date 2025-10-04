import { Switch, Theme } from '@/lib/consts.js';
import { i, $lget, $lset } from '@/lib/ext-apis.js';
import { confirmation } from './dialog/alerts.js';
import { createDialog } from './dialog/index.js';
import { h, div, btn } from '@/lib/dom.js';
import { getRadioValue, radio, selectRadioValue } from './radio.js';

/**
 * Settings dialog component
 * Provides various workspace management settings
 */
export default () => {
  // Theme selection
  const themeRadio = div('flex gap-2', [
    radio('theme', Theme.Auto, i('autoSystem')),
    radio('theme', Theme.Light, i('light')),
    radio('theme', Theme.Dark, i('dark')),
  ]);

  // Sync toggle
  const syncRadio = div('flex gap-2', [
    radio('sync', 'on', i('on')),
    radio('sync', 'off', i('off')),
  ]);

  const form = div('form-group', [h('label', { for: 'theme' }, i('theme')), themeRadio, syncRadio]);
  const resetBtn = btn('btn btn-secondary', i('reset'));
  const saveBtn = btn('btn btn-primary ms-2', i('save'));

  const { dialog, closeBtn } = createDialog(i('settings'), [form], [resetBtn, saveBtn]);
  dialog.setAttribute('aria-label', i('firefoxWorkspacesSettings'));
  closeBtn.title = i('closeSettingsDialog');

  // # register events
  const selectTheme = (value: Theme) => selectRadioValue(themeRadio, value);
  const selectSync = (value: Switch) => selectRadioValue(syncRadio, value);

  saveBtn.addEventListener('click', async () => {
    const theme = getRadioValue(themeRadio, Theme.Auto) as Theme;
    const sync = getRadioValue(syncRadio, Switch.On) as Switch;

    // Apply theme immediately
    applyTheme(theme);
    // Persist settings
    await $lset({ settings: { theme, sync } });

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
    selectSync(settings.sync);
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
