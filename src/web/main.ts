import { $id } from '@/lib/dom.js';
import { EventBus } from './event-bus.js';

// components
import header from './components/header.js';
import controls from './components/controls.js';
import list from './components/list.js';
import emptyState from './components/empty-state.js';
import formModal from './components/form-modal.js';

export function createMainPage() {
  const bus = new EventBus<WorkspaceEventMap>();
  const fm = formModal(bus);
  $id('app').append(header(), controls(bus), list(bus), emptyState(bus), fm.el);

  const emit: typeof bus.emit = (...args) => bus.emit(...args);

  const on: typeof bus.on = (...args) => bus.on(...args);

  return {
    /**
     * Edit a workspace config, open the form modal
     */
    edit: (workspace: Workspace) => bus.emit('edit-workspace', workspace),

    /**
     * Close the workspace edit modal
     */
    close: () => bus.emit('close-modal'),

    /**
     * Emit internal events
     */
    emit,

    /**
     * Register internal events
     */
    on,

    getEditingWorkspace: fm.getEditingWorkspace,

    /**
     * Render the list of workspaces
     */
    renderList: (workspaces: Workspace[]) => bus.emit('render-list', workspaces),
  };
}
