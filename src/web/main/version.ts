import { div, h } from '@/lib/dom.js';
import { i } from '@/lib/ext-apis.js';

export default () =>
  div('version', [
    h('p', '', ['v', `__VERSION__`]),
    h('p', '', `${i('lastUpdatedAt')} __DATE_TIME__`),
  ]);
