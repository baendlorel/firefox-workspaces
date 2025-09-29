import { EventBus } from 'minimal-event-bus';
import { btn, div, h } from '@/lib/dom.js';

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const newWorkspace = btn('btn btn-trans', 'New');
  const addCurrentTab = btn('btn btn-trans', 'Add Tab');
  newWorkspace.title = 'Create new workspace';
  addCurrentTab.title = 'Add current tab to a workspace';

  newWorkspace.addEventListener('click', () => bus.emit('edit', null));
  addCurrentTab.addEventListener('click', () => bus.emit('add-current-tab'));

  const title = h('h2', 'header-title', 'Workspace');
  // fixme .header::after的渐变不生效
  const header = div('header', [title, newWorkspace, addCurrentTab]);
  bus.on('set-current', (workspace) => {
    if (!workspace) {
      return;
    }
    title.textContent = workspace.name ?? 'Workspace';
    header.style.backgroundColor = workspace.color ?? 'var(--primary)';
  });

  return header;
};
