import { EventBus } from 'minimal-event-bus';
import { i } from '@/lib/polyfilled-api.js';

import { div, h } from '@/lib/dom.js';

import folderIcon from '@assets/folder.svg?raw';

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const icon = div('empty-state-icon');
  icon.innerHTML = folderIcon;

  const el = div('empty-state', [
    icon,
    h('p', 'mt-3', i('workspace.empty.no-workspaces')),
    h('p', 'mt-3', i('workspace.empty.get-started')),
  ]);

  bus.on('toggle-empty-state', (visible) => (el.style.display = visible ? 'block' : 'none'));
  return el;
};
