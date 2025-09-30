import { EventBus } from 'minimal-event-bus';
import { btn, div, h } from '@/lib/dom.js';
import { Consts } from '@/lib/consts.js';
import { Color } from '@/lib/color.js';

import plusSvg from '@web/assets/workspace-plus.svg?raw';
import listSvg from '@web/assets/list.svg?raw';
import { Menu } from '../components/menu/index.js';

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const addBtn = btn('btn-text', '');
  addBtn.title = 'Create new workspace';
  addBtn.innerHTML = plusSvg.replaceAll('currentColor', '#fff');
  addBtn.style.width = '18px';

  const moreBtn = btn('btn-text', '');
  moreBtn.title = 'More Actions';
  moreBtn.innerHTML = listSvg.replaceAll('currentColor', '#fff');
  moreBtn.style.width = '18px';

  const contextMenu = new Menu([
    { label: 'Add current tabs to a new Workspace', action: () => console.log('create') },
    { label: 'Import', action: () => console.log('Import') },
    { label: 'Export', action: () => console.log('Export') },
    { label: 'Settings', action: () => console.log('Settings') },
  ]);

  addBtn.addEventListener('click', () => bus.emit('edit', null));
  moreBtn.addEventListener('click', () => {
    const rect = moreBtn.getBoundingClientRect();
    const drect = contextMenu.getBoundingClientRect();
    const x = rect.x - drect.width - 1;
    const y = rect.y + rect.height - 1;
    contextMenu.show(x, y);
  });

  const title = h('h2', 'wb-header-title', 'Workspace');
  const header = div('wb-header', [title, addBtn, moreBtn]);
  bus.on('set-current', (workspace) => {
    title.textContent = workspace?.name ?? 'Workspace';
    const color = Color.from(workspace?.color ?? Consts.DefaultColor);
    const darken = color.adjustBrightness(-0.36);
    const gradient = `linear-gradient(160deg, ${color.toHex()} 0%, ${darken.toHex()} 100%)`;
    header.style.setProperty('--header-darken-gradient', gradient);
  });

  return header;
};
