import { EventBus } from 'minimal-event-bus';
import { btn, div, h } from '@/lib/dom.js';
import { Consts } from '@/lib/consts.js';
import { adjustBrightness } from '../components/color/utils.js';

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
    const color = workspace?.color ?? Consts.DefaultColor;
    const darken = adjustBrightness(color, 20);
    const gradient = `linear-gradient(135deg, ${color} 0%, ${darken} 100%)`;
    header.style.setProperty('--header-darken-gradient', gradient);
  });

  return header;
};
