import { div } from '@/lib/dom.js';

export default () =>
  div('version', [div('', `version __VERSION__`), div('', `last updated at __DATE_TIME__`)]);
