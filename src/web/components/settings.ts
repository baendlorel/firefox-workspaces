import { i, $send } from '@/lib/ext-apis.js';
import { store } from '@/lib/storage.js';
import { confirmation } from './dialog/alerts.js';
import { createDialog } from './dialog/index.js';
import { h, div, btn } from '@/lib/dom.js';
import { radio, getRadioValue, selectRadioValue } from './radio.js';

/**
 * Settings dialog component
 * Provides various workspace management settings
 */
export default () => {
  // Theme selection
  const themeRadio = div('form-group', [
    h('label', { for: 'theme' }, i('theme')),
    div('flex gap-2', [
      radio('theme', Theme.Auto, i('autoSystem')),
      radio('theme', Theme.Light, i('light')),
      radio('theme', Theme.Dark, i('dark')),
    ]),
  ]);
  themeRadio.style.display = 'none'; // # hide theme setting for now

  // Sync toggle
  const syncRadio = div('form-group', [
    h('label', { for: 'sync' }, [i('syncData'), h('div', 'description', i('syncDataDescription'))]),
    div('flex gap-2', [radio('sync', 'on', i('on')), radio('sync', 'off', i('off'))]),
  ]);

  const resetBtn = btn('btn btn-secondary', i('reset'));
  const saveBtn = btn('btn btn-primary ms-2', i('save'));

  const { dialog, closeBtn } = createDialog(
    i('settings'),
    [themeRadio, syncRadio],
    [resetBtn, saveBtn]
  );
  dialog.setAttribute('aria-label', i('firefoxWorkspacesSettings'));
  closeBtn.title = i('closeSettingsDialog');

  // # register events
  saveBtn.addEventListener('click', async () => {
    const theme = getRadioValue(themeRadio, Theme.Auto) as Theme;
    const sync = getRadioValue(syncRadio, Switch.On) as Switch;

    // Apply theme immediately
    applyTheme(theme);

    logger.info('Saving settings', { theme, sync });

    // Persist settings
    await store.localPersistSet({ settings: { theme, sync } });

    // apply sync setting
    await $send<ToggleSyncRequest>({ action: Action.ToggleSync, sync });

    dialog.bus.emit('close');
  });

  resetBtn.addEventListener('click', async () => {
    const yes = await confirmation(i('resetSettings'), i('areYouSure'));
    if (!yes) {
      return;
    }

    selectRadioValue(themeRadio, Theme.Auto);
    selectRadioValue(syncRadio, Switch.On);
    applyTheme(Theme.Auto);
  });

  // # load settings for editing
  dialog.bus.on('show', async () => {
    const { settings } = await store.localGet('settings');
    selectRadioValue(themeRadio, settings.theme ?? Theme.Auto);
    selectRadioValue(syncRadio, settings.sync ?? Switch.On);
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
