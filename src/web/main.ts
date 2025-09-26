import { $id } from '@/lib/dom.js';
import { emptyFunction } from '@/lib/consts.js';

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

  const wfm = workspaceFormModal({ onSave, onCancel, onSelectColor });
  const controlsArgs = {
    onNewWorkspace: () => wfm.edit(null),
    onAddCurrentTab,
  };

  const emptyStateEl = emptyState();
  const wl = workspaceList();

  $id('app').append(header(), controls(controlsArgs), wl.el, emptyStateEl, wfm.el);

  return {
    edit: wfm.edit,
    close: wfm.close,
    getEditingWorkspace: wfm.getEditingWorkspace,
    renderList: (workspaces: Workspace[]) => {
      emptyStateEl.style.display = workspaces.length === 0 ? 'block' : 'none';
      wl.renderList(workspaces);
    },
  };
}
