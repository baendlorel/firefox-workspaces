import { div } from '@/lib/dom.js';
import workspaceIcon from '@web/assets/workspace.svg?raw';

export default (color: HexColor): HTMLDivElement => {
  const el = div('wb-icon');
  el.innerHTML = workspaceIcon.replaceAll('currentColor', color);
  return el;
};
