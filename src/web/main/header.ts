import { EventBus } from 'minimal-event-bus';
import { btn, div, h, svg } from '@/lib/dom.js';
import { Consts } from '@/lib/consts.js';
import { Color } from '@/lib/color.js';
import { Menu } from '@web/components/menu/index.js';
import about from '@web/components/about.js';
import donate from '@web/components/donate.js';

import plusSvg from '@web/assets/workspace-plus.svg?raw';
import listSvg from '@web/assets/list.svg?raw';
import bookmarkPlusSvg from '@web/assets/bookmark-plus.svg?raw';
import boxArrowDownSvg from '@web/assets/box-arrow-down.svg?raw';
import boxArrowUpSvg from '@web/assets/box-arrow-up.svg?raw';
import bugSvg from '@web/assets/bug.svg?raw';
import heartSvg from '@web/assets/heart.svg?raw';
import gearSvg from '@web/assets/gear.svg?raw';
import workspaceSvg from '@web/assets/workspace.svg?raw';

const createContextMenu = (bus: EventBus<WorkspaceEditorEventMap>) => {
  const SIZE = 18;
  const COLOR = '#283343';

  const item = (svgStr: string, label: string) =>
    btn('btn-with-icon', [svg(svgStr, COLOR, SIZE), label]);

  const aboutDialog = about();
  const donateDialog = donate();

  const contextMenu = new Menu([
    {
      label: item(bookmarkPlusSvg, 'Create with current tabs'),
      action: () => logger.debug('Create new workspace action triggered'),
    },
    { label: item(boxArrowDownSvg, 'Import'), action: () => logger.debug() },
    { label: item(boxArrowUpSvg, 'Export'), action: () => logger.debug() },
    Menu.Divider,
    { label: item(bugSvg, 'Debug Info'), action: () => bus.emit('debug') },
    { label: item(gearSvg, 'Settings'), action: () => logger.debug() },
    Menu.Divider,
    {
      label: item(heartSvg, 'Donate'),
      action: () => donateDialog.bus.emit('show'),
    },
    {
      label: item(workspaceSvg, 'About'),
      action: function (this) {
        this.close();
        aboutDialog.bus.emit('show');
      },
    },
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
