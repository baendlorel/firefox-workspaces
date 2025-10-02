import { createDialog } from './dialog/index.js';
import { h } from '@/lib/dom.js';

// todo 完善about页面
/**
 * About dialog component
 * Uses the project's dialog utilities and dom helpers to match style
 */
export default (): HTMLDialogElement => {
  const href = 'https://github.com/baendlorel/firefox-workspaces';

  const rawBody = [
    h('p', '', `__NAME__ v__VERSION__ `),
    h('p', '', `A simple workspace manager.`),
    h('p', '', [h('a', { href }, 'Repository')]),
    h('p', '', '© __AUTHOR_NAME__ Licensed under MIT.'),
    h('p', '', 'Contact __AUTHOR_EMAIL__'),
  ];

  const { dialog, body, closeBtn } = createDialog('About', rawBody);
  body.style.fontFamily = 'monospace';

  // small accessibility/title tweaks
  dialog.setAttribute('aria-label', 'About Firefox Workspaces');
  closeBtn.title = 'Close about dialog';

  document.body.appendChild(dialog);
  return dialog;
};
