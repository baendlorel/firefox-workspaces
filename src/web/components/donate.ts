import { createDialog } from './dialog/index.js';
import { i } from '@/lib/ext-apis.js';
import { div, h } from '@/lib/dom.js';
import donateEnPng from '@assets/donate-small.png';

/**
 * About dialog component
 * Uses the project's dialog utilities and dom helpers to match style
 */
export default (): HTMLDialogElement => {
  const { dialog } = createDialog(i('donate'), [
    div('mb-4', 'Your supportYour support motivates me to keep creating 🌟'),
    h('img', { class: 'donate-img', src: donateEnPng }),
  ]);

  document.body.appendChild(dialog);
  return dialog;
};
