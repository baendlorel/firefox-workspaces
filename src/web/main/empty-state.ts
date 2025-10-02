import { EventBus } from 'minimal-event-bus';
import { div, h } from '@/lib/dom.js';
import folderIcon from '@web/assets/folder.svg?raw';
import popupService from '../popup.service.js';

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const icon = div('empty-state-icon');
  icon.innerHTML = folderIcon;

  const el = div('empty-state', [
    icon,
    h('p', '', 'No workspaces yet.'),
    h('p', '', 'Create a new workspace to get started!'),
  ]);

  bus.on('render-list', () => (el.style.display = popupService.isNoWorkspace ? 'block' : 'none'));
  return el;
};
