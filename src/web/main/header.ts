import { EventBus } from 'minimal-event-bus';
import { btn, div, h } from '@/lib/dom.js';
import { Consts } from '@/lib/consts.js';
import { Color } from '@/lib/color.js';

// import folderPlus from '@web/assets/folder-plus.svg?raw';
import plusSvg from '@web/assets/workspace-plus.svg?raw';
import listSvg from '@web/assets/list.svg?raw';

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const addBtn = btn('btn-text', '');
  addBtn.title = 'Create new workspace';
  addBtn.innerHTML = plusSvg.replaceAll('currentColor', '#fff');
  addBtn.style.width = '18px';

  const listBtn = btn('btn-text', '');
  listBtn.title = 'Create new workspace';
  listBtn.innerHTML = listSvg.replaceAll('currentColor', '#fff');
  listBtn.style.width = '18px';

  addBtn.addEventListener('click', () => bus.emit('edit', null));

  const title = h('h2', 'wb-header-title', 'Workspace');
  const header = div('wb-header', [title, addBtn]);
  bus.on('set-current', (workspace) => {
    title.textContent = workspace?.name ?? 'Workspace';
    const color = Color.from(workspace?.color ?? Consts.DefaultColor);
    const darken = color.adjustBrightness(-0.36);
    const gradient = `linear-gradient(160deg, ${color.toHex()} 0%, ${darken.toHex()} 100%)`;
    header.style.setProperty('--header-darken-gradient', gradient);
  });

  return header;
};
