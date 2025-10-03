import '@/lib/promise-ext.js';
import { createView } from './view.js';
import { danger } from './components/dialog/alerts.js';
import { Consts } from '@/lib/consts.js';

Promise.dialogDanger = danger;

document.addEventListener('DOMContentLoaded', () => {
  createView();
  Reflect.set(window, Consts.InjectionFlag, true);
});
