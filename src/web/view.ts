import { EventBus } from 'minimal-event-bus';
import { $id, h } from '@/lib/dom.js';
import icon from '@web/assets/workspace.svg';

// components
import header from './main/header.js';
import list from './main/list.js';
import emptyState from './main/empty-state.js';
import editor from './main/editor.js';
import tabs from './main/tabs.js';
import version from './main/version.js';

export function createView() {
  document.head.appendChild(h('link', { rel: 'icon', href: icon }));

  const { bus, emit, on } = EventBus.create<WorkspaceEditorEventMap>();
  const children = [
    // header
    header(bus),

    // body
    list(bus),
    emptyState(bus),

    // footer
    version(),

    // other components
    editor(bus),
  ];

  $id('app').append(...children);

  // only for registering the 'render-tab' event
  tabs(bus);

  return {
    /**
     * Emit internal events
     */
    emit,

    /**
     * Register internal events
     */
    on,
  };
}
