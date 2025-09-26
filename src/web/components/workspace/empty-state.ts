import { div, h } from '@/lib/dom.js';
import { EventBus } from '../../event-bus.js';
import folderIcon from '../assets/folder.svg';

export default (bus: EventBus<WorkspaceEventMap>) => {
  const icon = h('img', 'empty-state-icon');
  icon.src = folderIcon;

  const el = div({ class: 'empty-state', style: 'display: none' }, [
    icon,
    h('p', '', 'No workspaces yet.'),
    h('p', '', 'Create a new workspace to get started!'),
  ]);

  bus.on('render-list', (list) => (el.style.display = list.length === 0 ? 'block' : 'none'));
  return el;
};
