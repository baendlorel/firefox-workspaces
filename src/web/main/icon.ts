import { btn, div, svg } from '@/lib/dom.js';
import workspaceIcon from '@assets/workspace.svg?raw';

export const wbicon = (color: HexColor): HTMLSpanElement => {
  // const c = Color.from(color);  c.brightness > 128 ? '#374151' : 'transparent';
  const bg = 'transparent';
  const icon = div('wb-icon', [svg(workspaceIcon, color, 21)]);
  icon.style.backgroundColor = bg;
  return icon;
};

export const btnWithIcon = (svgStr: string, label: string) =>
  btn('btn-with-icon', [svg(svgStr, '#283343', 16), label]);
