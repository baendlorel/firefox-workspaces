import { div } from '@/lib/dom.js';

export default (color: HexColor): HTMLDivElement => {
  const el = div('wb-icon');
  el.style.backgroundColor = color;
  return el;
};
