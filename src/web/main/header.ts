import { EventBus } from 'minimal-event-bus';
import { btn, div, h, svg } from '@/lib/dom.js';
import { Consts } from '@/lib/consts.js';
import { Color } from '@/lib/color.js';
import { logger } from '@/lib/logger.js';

import plusSvg from '@web/assets/workspace-plus.svg?raw';
import listSvg from '@web/assets/list.svg?raw';
import { Menu } from '../components/menu/index.js';

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const addBtn = btn({ class: 'btn-text', title: 'New workspace' }, [svg(plusSvg, '#fff', 18, 18)]);
  const moreBtn = btn({ class: 'btn-text', title: 'More Actions' }, [svg(listSvg, '#fff', 18, 18)]);
  const contextMenu = new Menu([
    { label: 'Add current tabs to a new Workspace', action: () => logger.debug('header', 'Create new workspace action triggered') },
    { label: 'Import', action: () => logger.debug('header', 'Import action triggered') },
    { label: 'Export', action: () => logger.debug('header', 'Export action triggered') },
    { label: 'Settings', action: () => logger.debug('header', 'Settings action triggered') },
  ]);
  const title = h('h2', 'wb-header-title', 'Workspace');
  const header = div('wb-header', [title, addBtn, moreBtn]);

  // # register events

  bus.on('set-current', (workspace) => {
    title.textContent = workspace?.name ?? 'Workspace';
    const color = Color.from(workspace?.color ?? Consts.DefaultColor);
    const darken = color.adjustBrightness(-0.36);
    const gradient = `linear-gradient(160deg, ${color.toHex()} 0%, ${darken.toHex()} 100%)`;
    header.style.setProperty('--header-darken-gradient', gradient);
  });

  addBtn.addEventListener('click', () => bus.emit('edit', null));
  moreBtn.addEventListener('click', () => {
    const rect = moreBtn.getBoundingClientRect();
    const drect = contextMenu.getBoundingClientRect();
    const x = rect.x - drect.width - 1;
    const y = rect.y + rect.height - 1;
    contextMenu.show(x, y);
  });

  return header;
};
