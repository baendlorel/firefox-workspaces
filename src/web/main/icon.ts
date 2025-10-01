import { Color } from '@/lib/color.js';
import { div, svg } from '@/lib/dom.js';
import workspaceIcon from '@web/assets/workspace.svg?raw';

export const wbicon = (color: HexColor): HTMLSpanElement => {
  const c = Color.from(color);
  const bg = 'transparent'; // c.brightness > 128 ? '#374151' : 'transparent';
  const icon = div('wb-icon', [svg(workspaceIcon, color, 21)]);
  icon.style.backgroundColor = bg;
  return icon;
};
