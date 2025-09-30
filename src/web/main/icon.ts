import { div, initSvg } from '@/lib/dom.js';
import workspaceIcon from '@web/assets/workspace.svg?raw';

export const wbicon = (color: HexColor): HTMLSpanElement => {
  const el = div('wb-icon');
  el.innerHTML = initSvg(workspaceIcon, color);
  return el;
};
