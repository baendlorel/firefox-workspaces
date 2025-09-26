import { $id } from '@/lib/dom.js';
import { emptyFunction } from '@/lib/consts.js';
import { EventBus } from './event-bus.js';

// components
import header from './components/header.js';
import controls from './components/controls.js';
import workspaceList from './components/workspace-list.js';
import emptyState from './components/empty-state.js';
import workspaceFormModal from './components/workspace-form-modal.js';

export function createMainPage(args: Partial<CreateMainPageArgs>) {
  const {
    onAddCurrentTab = emptyFunction,
    onCancel = emptyFunction,
    onSave = emptyFunction,
    onSelectColor = emptyFunction,
  } = args;

  const bus = new EventBus<WorkspaceEventMap>();

  const wfm = workspaceFormModal(bus);

  $id('app').append(header(), controls(bus), workspaceList(bus), emptyState(bus), wfm.el);

  return {
    edit: (workspace: Workspace) => bus.emit('edit-workspace', workspace),
    close: () => bus.emit('close-modal'),
    // getEditingWorkspace: wfm.getEditingWorkspace,
    renderList: (workspaces: Workspace[]) => bus.emit('render-list', workspaces),
  };
}
