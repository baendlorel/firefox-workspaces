import { EventBus } from 'minimal-event-bus';
import { i, $send } from '@/lib/polyfilled-api.js';

import { btn, div, h, svg } from '@/lib/dom.js';
import { Color } from '@/lib/color.js';
import { store } from '@/lib/storage.js';
import popupService from '@web/popup.service.js';

import { Menu } from '@comp/menu/index.js';
import settings from '@comp/settings.js';
import { btnWithIcon } from './icon.js';
import { SyncIcon } from './sync-icon.js';
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

function createCreateMenu(bus: EventBus<WorkspaceEditorEventMap>) {
  const contextMenu = new Menu([
    {
      label: btnWithIcon(bookmarkPlusSvg, i('workspace.create-with-current-tabs')),
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
      label: btnWithIcon(plusSvg, i('workspace.new')),
      action: async function (this) {
        bus.emit('edit', null);
        this.close();
      },
    },
  ]);

  return contextMenu;
}

function createMoreActionMenu(_bus: EventBus<WorkspaceEditorEventMap>) {
  const settingsDialog = settings();

  const contextMenu = new Menu([
    {
      label: btnWithIcon(boxArrowDownSvg, i('menu.import')),
      action: function (this: Menu) {
        this.close();
        $send<OpenPageRequest>({ action: Action.OpenPage, page: PopupPage.Import });
      },
    },
    {
      label: btnWithIcon(boxArrowUpSvg, i('menu.export')),
      action: async function (this) {
        await popupService.exportData();
        this.close();
      },
    },
    Menu.Divider,
    // {
    //   label: btnWithIcon(bugSvg, i('menu.debug-info')),
    //   action: async () => {
    //     const { workspaces } = await store.localGet('workspaces');
    //     logger.debug('workspaces', stringify(workspaces));
    //   },
    // },
    {
      label: btnWithIcon(gearSvg, i('menu.settings')),
      action: function (this) {
        settingsDialog.bus.emit('show');
        this.close();
      },
    },
    Menu.Divider,
    {
      label: btnWithIcon(heartSvg, i('donate.title')),
      action: function (this) {
        this.close();
        $send<OpenPageRequest>({ action: Action.OpenPage, page: PopupPage.Donate });
      },
    },
    {
      label: btnWithIcon(workspaceSvg, i('menu.about')),
      action: function (this) {
        this.close();
        $send<OpenPageRequest>({ action: Action.OpenPage, page: PopupPage.About });
      },
    },
  ]);

  return contextMenu;
}

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const createMenu = createCreateMenu(bus);
  const moreActionMenu = createMoreActionMenu(bus);

  const title = h('h2', 'wb-header-title', i('workspace.title'));
  const syncIcon = new SyncIcon();
  const syncDiv = div({ title: i('workspace.sync-icon-title', { minute: Consts.SyncInterval }) }, [
    syncIcon.el,
  ]);
  const addBtn = btn('btn-text', i('button.new'));
  const moreBtn = btn({ class: 'btn-text', style: 'margin-top:2px' }, [
    svg(listSvg, undefined, 18),
  ]);
  const header = div('wb-header', [title, syncDiv, addBtn, moreBtn]);

  bus.on('change-sync-state', (...args) => syncIcon.setStatus(...args));

  // # register events
  popupService.getWorkspaceOfCurrentWindow().then((workspace) => {
    title.textContent = workspace?.name ?? i('workspace.title');
    const color = Color.from(workspace?.color ?? Consts.DefaultColor);
    const darken = color.adjustBrightness(-0.36);
    const gradient = `linear-gradient(160deg, ${color.toHex()} 0%, ${darken.toHex()} 100%)`;
    header.style.setProperty('--header-darken-gradient', gradient);
  });

  addBtn.addEventListener('click', () => createMenu.showBeside(addBtn));
  moreBtn.addEventListener('click', () => moreActionMenu.showBeside(moreBtn));

  return header;
};
