import { EventBus } from 'minimal-event-bus';
import { i } from '@/lib/polyfilled-api.js';
import { div, h } from '@/lib/dom.js';

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const el = div('empty-state', [
    h('p', 'mt-3', i('workspace.empty.no-workspaces')),
    h('p', 'mt-3', i('workspace.empty.get-started')),
  ]);
  el.style.paddingTop = '270px';

  bus.on('toggle-empty-state', (visible) => (el.style.display = visible ? 'block' : 'none'));
  return el;
};
