import { btn, div } from '@/lib/dom.js';
import { EventBus } from '@web/event-bus.js';

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const newWorkspace = btn('btn', 'New Workspace');
  const addCurrentTab = btn('btn btn-secondary', 'Add Current Tab');
  newWorkspace.addEventListener('click', () => bus.emit('edit', null));
  addCurrentTab.addEventListener('click', () => bus.emit('add-current-tab'));
  return div('controls', [newWorkspace, addCurrentTab]);
};
