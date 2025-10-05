import { createView } from './view.js';

document.addEventListener('DOMContentLoaded', () => {
  createView();
  Reflect.set(window, Consts.InjectionFlag, true);
});
