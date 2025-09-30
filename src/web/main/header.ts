import { EventBus } from 'minimal-event-bus';
import { btn, div, h, svg } from '@/lib/dom.js';
import { Consts } from '@/lib/consts.js';
import { Color } from '@/lib/color.js';
import { Menu } from '@web/components/menu/index.js';

import plusSvg from '@web/assets/workspace-plus.svg?raw';
import listSvg from '@web/assets/list.svg?raw';
import boxArrowDownSvg from '@web/assets/box-arrow-down.svg?raw';
import boxArrowUpSvg from '@web/assets/box-arrow-up.svg?raw';
import bugSvg from '@web/assets/bug.svg?raw';
import gearSvg from '@web/assets/gear.svg?raw';

const createContextMenu = (bus: EventBus<WorkspaceEditorEventMap>) => {
  const SIZE = 18;
  const COLOR = '#737a84';
  const s2 = svg(boxArrowDownSvg, COLOR, SIZE);
  const s3 = svg(boxArrowUpSvg, COLOR, SIZE);
  const s4 = svg(gearSvg, COLOR, SIZE);
  const s5 = svg(bugSvg, COLOR, SIZE);
  const s6 = svg(bugSvg, COLOR, SIZE);
  const btn2 = btn('btn-with-icon', [s2, 'Import']);
  const btn3 = btn('btn-with-icon', [s3, 'Export']);
  const btn4 = btn('btn-with-icon', [s4, 'Settings']);
  const btn5 = btn('btn-with-icon', [s5, 'About']);
  const btn6 = btn('btn-with-icon', [s6, 'Debug Info']);

  const contextMenu = new Menu([
    {
      label: 'Create with current tabs',
      action: () => logger.debug('Create new workspace action triggered'),
    },
    { label: btn2, action: () => logger.debug(btn2.innerText) },
    { label: btn3, action: () => logger.debug(btn3.innerText) },
    'divider',
    { label: btn4, action: () => logger.debug(btn4.innerText) },
    { label: btn5, action: () => logger.debug(btn5.innerText) },
    'divider',
    { label: btn6, action: () => bus.emit('debug') },
  ]);

  return contextMenu;
};

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const addBtn = btn({ class: 'btn-text', title: 'New workspace' }, [svg(plusSvg, '#fff', 18, 18)]);
  const moreBtn = btn({ class: 'btn-text', title: 'More Actions' }, [svg(listSvg, '#fff', 18, 18)]);
  const contextMenu = createContextMenu(bus);

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
