// css
import './css/theme.css';
import './css/main.css';
import './css/workspace.css';
import './css/form.css';

// packages
import { EventBus } from 'minimal-event-bus';
import { $id, h } from '@/lib/dom.js';

// components
import header from './main/header.js';
import list from './main/list.js';
import emptyState from './main/empty-state.js';
import editor from './main/editor.js';
import version from './main/version.js';

export function createView() {
  const { bus, emit, on } = EventBus.create<WorkspaceEditorEventMap>();
  const body = h('main', '', [list(bus), emptyState(bus)]);
  const children = [
    // header
    header(bus),

    // body
    body,

    // footer
    version(),
  ];

  $id('app').append(...children);

  document.body.appendChild(editor(bus));

  // # initial render
  emit('render-list');

  return { emit, on };
}
