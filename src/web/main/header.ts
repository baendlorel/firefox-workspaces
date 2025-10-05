import { EventBus } from 'minimal-event-bus';
import { btn, div, h, svg } from '@/lib/dom.js';
import { Consts, Action } from '@/lib/consts.js';
import { Color } from '@/lib/color.js';
import { i, $send } from '@/lib/ext-apis.js';
import { store } from '@/lib/storage.js';
import popupService from '@web/popup.service.js';

import { Menu } from '@comp/menu/index.js';
import about from '@comp/about.js';
import donate from '@comp/donate.js';
import settings from '@comp/settings.js';
import { btnWithIcon } from './icon.js';
import { stringify } from './debug.js';

import plusSvg from '@assets/workspace-plus.svg?raw';
import listSvg from '@assets/list.svg?raw';
import bookmarkPlusSvg from '@assets/bookmark-plus.svg?raw';
import boxArrowDownSvg from '@assets/box-arrow-down.svg?raw';
import boxArrowUpSvg from '@assets/box-arrow-up.svg?raw';
import bugSvg from '@assets/bug.svg?raw';
import heartSvg from '@assets/heart.svg?raw';
import gearSvg from '@assets/gear.svg?raw';
import workspaceSvg from '@assets/workspace.svg?raw';

const importData = function (this: Menu) {
  this.close();
  return $send<ImportRequest>({
    action: Action.Import,
  }).catch((e) => logger.error('Failed to trigger import:', e));
};

function createCreateMenu(bus: EventBus<WorkspaceEditorEventMap>) {
  const contextMenu = new Menu([
    {
      label: btnWithIcon(bookmarkPlusSvg, i('createWithCurrentTabs')),
      action: async function (this) {
        // Get current window tabs
        const currentWindow = await browser.windows.getCurrent();
        const tabs = await browser.tabs.query({ windowId: currentWindow.id });

        // Emit edit event with tabs
        bus.emit('edit', null, tabs);
        this.close();
      },
    },
    {
      label: btnWithIcon(plusSvg, i('newWorkspace')),
      action: async function (this) {
        bus.emit('edit', null);
        this.close();
      },
    },
  ]);

  return contextMenu;
}

function createMoreActionMenu(_bus: EventBus<WorkspaceEditorEventMap>) {
  const aboutDialog = about();
  const donateDialog = donate();
  const settingsDialog = settings();

  const contextMenu = new Menu([
    {
      label: btnWithIcon(boxArrowDownSvg, i('import')),
      action: importData,
    },
    {
      label: btnWithIcon(boxArrowUpSvg, i('export')),
      action: async function (this) {
        await popupService.exportData();
        this.close();
      },
    },
    Menu.Divider,
    {
      label: btnWithIcon(bugSvg, i('debugInfo')),
      action: async () => {
        const { workspaces } = await store.localGet('workspaces');
        logger.debug('workspaces', stringify(workspaces));
      },
    },
    {
      label: btnWithIcon(gearSvg, i('settings')),
      action: function (this) {
        settingsDialog.bus.emit('show');
        this.close();
      },
    },
    Menu.Divider,
    {
      label: btnWithIcon(heartSvg, i('donate')),
      action: function (this) {
        donateDialog.bus.emit('show');
        this.close();
      },
    },
    {
      label: btnWithIcon(workspaceSvg, i('about')),
      action: function (this) {
        aboutDialog.bus.emit('show');
        this.close();
      },
    },
  ]);

  return contextMenu;
}

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const addBtn = btn({ class: 'btn-text', title: i('newWorkspace') }, i('new'));
  const moreBtn = btn({ class: 'btn-text', title: i('moreActions') }, [svg(listSvg, '#fff', 18)]);
  const createMenu = createCreateMenu(bus);
  const moreActionMenu = createMoreActionMenu(bus);

  const title = h('h2', 'wb-header-title', i('workspace'));
  const header = div('wb-header', [title, addBtn, moreBtn]);

  // # register events
  popupService.getWorkspaceOfCurrentWindow().then((workspace) => {
    title.textContent = workspace?.name ?? i('workspace');
    const color = Color.from(workspace?.color ?? Consts.DefaultColor);
    const darken = color.adjustBrightness(-0.36);
    const gradient = `linear-gradient(160deg, ${color.toHex()} 0%, ${darken.toHex()} 100%)`;
    header.style.setProperty('--header-darken-gradient', gradient);
  });

  addBtn.addEventListener('click', () => createMenu.showBeside(addBtn));
  moreBtn.addEventListener('click', () => moreActionMenu.showBeside(moreBtn));

  return header;
};
