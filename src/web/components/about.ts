import { EventBus } from 'minimal-event-bus';
import { createDialog } from './dialog/index.js';
import { h } from '@/lib/dom.js';

// todo 完善about页面
/**
 * About dialog component
 * Uses the project's dialog utilities and dom helpers to match style
 */
export default (bus: EventBus<WorkspaceEditorEventMap>): HTMLDialogElement => {
  const body = [
    h('p', 'about-text', `Firefox Workspaces — Manage and restore groups of tabs with ease.`),
    h('p', 'about-version', `Version: __VERSION__`),
    h('p', 'about-links', [
      h('a', 'about-link', 'Repository'),
      h('span', 'about-sep', ' • '),
      h('a', 'about-link', 'Changelog'),
    ]),
    h('p', 'about-copy', '© Your Name. Licensed under MIT.'),
  ];

  const { dialog, closeBtn } = createDialog('About', body);

  // small accessibility/title tweaks
  dialog.setAttribute('aria-label', 'About Firefox Workspaces');
  closeBtn.title = 'Close about dialog';

  bus.on('open-about', () => dialog.bus.emit('show'));

  return dialog;
};
