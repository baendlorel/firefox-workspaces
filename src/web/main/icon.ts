import { div, svg } from '@/lib/dom.js';
import workspaceIcon from '@web/assets/workspace.svg?raw';

export const wbicon = (color: HexColor): HTMLSpanElement =>
  div('wb-icon', [svg(workspaceIcon, color, 21)]);
