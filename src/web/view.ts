import { EventBus } from 'minimal-event-bus';
import { $id, h } from '@/lib/dom.js';
import icon from '@web/assets/workspace.svg';

// components
import header from './components/workspace/header.js';
import list from './components/workspace/list.js';
import emptyState from './components/workspace/empty-state.js';
import editor from './components/workspace/editor.js';
import tabs from './components/workspace/tabs.js';
import version from './components/workspace/version.js';

// todo 使用tailwind css
export function createView() {
  document.head.appendChild(h('link', { rel: 'icon', href: icon }));

  const { bus, emit, on } = EventBus.create<WorkspaceEditorEventMap>();
  const children = [
    // header
    header(bus),
    // body
    list(bus),
    emptyState(bus),
    version(),
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
