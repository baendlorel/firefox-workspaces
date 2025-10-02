import { EventBus } from 'minimal-event-bus';
import { div, h } from '@/lib/dom.js';
import { i } from '@/lib/ext-apis.js';
import folderIcon from '@web/assets/folder.svg?raw';
import popupService from '../popup.service.js';

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const icon = div('empty-state-icon');
  icon.innerHTML = folderIcon;

  const el = div('empty-state', [
    icon,
    h('p', '', i('noWorkspacesYet')),
    h('p', '', i('createWorkspaceToGetStarted')),
  ]);

  bus.on('render-list', () => (el.style.display = popupService.isEmpty ? 'block' : 'none'));
  return el;
};
