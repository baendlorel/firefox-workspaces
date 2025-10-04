import { createView } from './view.js';
import { Consts } from '@/lib/consts.js';

document.addEventListener('DOMContentLoaded', () => {
  createView();
  Reflect.set(window, Consts.InjectionFlag, true);
});
