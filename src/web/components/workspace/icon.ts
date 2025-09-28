import { h } from '@/lib/dom.js';
import workspaceIcon from '@web/assets/workspace.svg?raw';

export const wbicon = (color: HexColor): HTMLSpanElement => {
  const el = h('span', 'wb-icon');
  el.innerHTML = workspaceIcon.replaceAll('currentColor', color);
  return el;
};
