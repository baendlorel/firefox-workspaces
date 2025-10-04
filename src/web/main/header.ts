import { EventBus } from 'minimal-event-bus';
import { btn, div, h, svg } from '@/lib/dom.js';
import { Consts, Action } from '@/lib/consts.js';
import { Color } from '@/lib/color.js';
import { i, $lget, $send } from '@/lib/ext-apis.js';
import popupService from '@web/popup.service.js';

import { Menu } from '@web/components/menu/index.js';
import about from '@web/components/about.js';
import donate from '@web/components/donate.js';
import settings from '@web/components/settings.js';
import { btnWithIcon } from './icon.js';
import { stringify } from './debug.js';

import plusSvg from '@web/assets/workspace-plus.svg?raw';
import listSvg from '@web/assets/list.svg?raw';
import bookmarkPlusSvg from '@web/assets/bookmark-plus.svg?raw';
import boxArrowDownSvg from '@web/assets/box-arrow-down.svg?raw';
import boxArrowUpSvg from '@web/assets/box-arrow-up.svg?raw';
import bugSvg from '@web/assets/bug.svg?raw';
import heartSvg from '@web/assets/heart.svg?raw';
import gearSvg from '@web/assets/gear.svg?raw';
import workspaceSvg from '@web/assets/workspace.svg?raw';

const importData = async () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await $send<ImportRequest>({
        action: Action.Import,
        data,
      });
    } catch (error) {
      alert(i('failedToParseFile', error));
    }
  };
  input.click();
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
        const state = await popupService.getExportData();

        // Create and download JSON file
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `firefox-workspaces-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.close();
      },
    },
    Menu.Divider,
    {
      label: btnWithIcon(bugSvg, i('debugInfo')),
      action: async () => {
        const workspaces = await $lget('workspaces');
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
  const addBtn = btn({ class: 'btn-text', title: i('newWorkspace') }, [svg(plusSvg, '#fff', 18)]);
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
