import { $id } from '@/lib/dom.js';
import { EventBus } from './event-bus.js';

// components
import header from './components/workspace/header.js';
import controls from './components/workspace/controls.js';
import list from './components/workspace/list.js';
import emptyState from './components/workspace/empty-state.js';
import editor from './components/workspace/editor.js';
import tabs from './components/workspace/tabs.js';

export function createMainPage() {
  const bus = new EventBus<WorkspaceEditorEventMap>();
  const children = [
    // header
    header(controls(bus)),
    // body
    list(bus),
    emptyState(bus),
    editor(bus),
  ];

  $id('app').append(...children);

  // only for registering the 'render-tab' event
  tabs(bus);

  return {
    /**
     * Emit internal events
     */
    emit: bus.getEmitFn(),

    /**
     * Register internal events
     */
    on: bus.getOnFn(),
  };
}
