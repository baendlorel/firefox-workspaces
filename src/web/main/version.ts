import { div, h } from '@/lib/dom.js';

export default () =>
  div('version', [h('p', '', ['v', `__VERSION__`]), h('p', '', `last updated at __DATE_TIME__`)]);
