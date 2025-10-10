import { EventBus } from 'minimal-event-bus';
import { i } from '@/lib/polyfilled-api.js';
import { div, h } from '@/lib/dom.js';

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const el = div({ class: 'empty-state', style: 'padding-top:270px' }, [
    h('p', 'mt-3', i('workspace.empty.no-workspaces')),
    h('p', 'mt-3', i('workspace.empty.get-started')),
  ]);

  bus.on('toggle-empty-state', (visible) => (el.style.display = visible ? 'block' : 'none'));
  return el;
};
