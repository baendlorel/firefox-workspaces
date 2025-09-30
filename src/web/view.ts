import { EventBus } from 'minimal-event-bus';
import { $id } from '@/lib/dom.js';

// components
import header from './main/header.js';
import list from './main/list.js';
import emptyState from './main/empty-state.js';
import editor from './main/editor.js';
import version from './main/version.js';
import about from './components/about.js';

export function createView() {
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
    about(bus),
  ];

  $id('app').append(...children);

  return { emit, on };
}
