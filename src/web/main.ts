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
  const editorEl = editor(bus);
  $id('app').append(header(), controls(bus), list(bus), emptyState(bus), editorEl.el);
  // only for registering the 'render-tab' event
  tabs(bus);

  const emit: typeof bus.emit = (...args) => bus.emit(...args);

  const on: typeof bus.on = (...args) => bus.on(...args);

  return {
    /**
     * Emit internal events
     */
    emit,

    /**
     * Register internal events
     */
    on,

    getEditingWorkspace: editorEl.getEditingWorkspace,
  };
}
