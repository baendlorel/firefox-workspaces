import { EventBus } from 'minimal-event-bus';
import { btn, div, h } from '@/lib/dom.js';
import { Consts } from '@/lib/consts.js';
import { Color } from '@/lib/color.js';

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const newWorkspace = btn('btn btn-trans', 'New');
  const addCurrentTab = btn('btn btn-trans', 'Add Tab');
  newWorkspace.title = 'Create new workspace';
  addCurrentTab.title = 'Add current tab to a workspace';

  newWorkspace.addEventListener('click', () => bus.emit('edit', null));
  addCurrentTab.addEventListener('click', () => bus.emit('add-current-tab'));

  const title = h('h2', 'header-title', 'Workspace');
  const header = div('header', [title, newWorkspace, addCurrentTab]);
  bus.on('set-current', (workspace) => {
    title.textContent = workspace?.name ?? 'Workspace';
    const color = Color.from(workspace?.color ?? Consts.DefaultColor);
    const darken = color.adjustBrightness(-0.36);
    const gradient = `linear-gradient(160deg, ${color.toHex()} 0%, ${darken.toHex()} 100%)`;
    header.style.setProperty('--header-darken-gradient', gradient);
  });

  return header;
};
