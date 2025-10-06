import { div, h } from '@/lib/dom.js';

export default () => div('version', [h('p', '', `v__VERSION__ - __DATE__`)]);
