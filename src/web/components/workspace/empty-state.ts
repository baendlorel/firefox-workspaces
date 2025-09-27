import { EventBus } from 'minimal-event-bus';
import { div, h } from '@/lib/dom.js';
import folderIcon from '@web/assets/folder.svg?raw';

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const icon = div('empty-state-icon');
  icon.innerHTML = folderIcon;

  const el = div({ class: 'empty-state', style: 'display: none' }, [
    icon,
    h('p', '', 'No workspaces yet.'),
    h('p', '', 'Create a new workspace to get started!'),
  ]);

  bus.on('render-list', (list) => (el.style.display = list.length === 0 ? 'block' : 'none'));
  return el;
};
