import { EventBus } from 'minimal-event-bus';
import { i } from '@/lib/polyfilled-api.js';
import { div, h, svg } from '@/lib/dom.js';
import folderSvg from '@assets/folder.svg?raw';

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const el = div('empty-state', [
    div('empty-state-icon', [svg(folderSvg)]),
    h('p', 'mt-3', i('workspace.empty.no-workspaces')),
    h('p', 'mt-3', i('workspace.empty.get-started')),
  ]);

  bus.on('toggle-empty-state', (visible) => (el.style.display = visible ? 'block' : 'none'));
  return el;
};
