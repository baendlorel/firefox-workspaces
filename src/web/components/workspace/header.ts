import { div } from '@/lib/dom.js';

export default (children: HTMLElement[]) =>
  div('header', [
    /// h('h1', 'title', 'Workspaces Manager'),
    ...children,
  ]);
