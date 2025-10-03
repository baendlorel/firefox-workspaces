import { EventBus } from 'minimal-event-bus';
import { btn, div, h, svg } from '@/lib/dom.js';
import { Consts, Action } from '@/lib/consts.js';
import { Color } from '@/lib/color.js';
import { $lsget, $send, i } from '@/lib/ext-apis.js';
import popupService from '@web/popup.service.js';

import { Menu } from '@web/components/menu/index.js';
import about from '@web/components/about.js';
import donate from '@web/components/donate.js';
import settings from '@web/components/settings.js';

import plusSvg from '@web/assets/workspace-plus.svg?raw';
import listSvg from '@web/assets/list.svg?raw';
import bookmarkPlusSvg from '@web/assets/bookmark-plus.svg?raw';
import boxArrowDownSvg from '@web/assets/box-arrow-down.svg?raw';
import boxArrowUpSvg from '@web/assets/box-arrow-up.svg?raw';
import bugSvg from '@web/assets/bug.svg?raw';
import heartSvg from '@web/assets/heart.svg?raw';
import gearSvg from '@web/assets/gear.svg?raw';
import workspaceSvg from '@web/assets/workspace.svg?raw';

import { stringify } from './debug.js';

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

function createContextMenu(bus: EventBus<WorkspaceEditorEventMap>) {
  const SIZE = 18;
  const COLOR = '#283343';

  const item = (svgStr: string, label: string) =>
    btn('btn-with-icon', [svg(svgStr, COLOR, SIZE), label]);

  const aboutDialog = about();
  const donateDialog = donate();
  const settingsDialog = settings();

  const contextMenu = new Menu([
    {
      label: item(bookmarkPlusSvg, i('createWithCurrentTabs')),
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
      label: item(boxArrowDownSvg, i('import')),
      action: importData,
    },
    {
      label: item(boxArrowUpSvg, i('export')),
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
      label: item(bugSvg, i('debugInfo')),
      action: async () => {
        const workspaces = await $lsget('workspaces');
        logger.debug('workspaces', stringify(workspaces));
      },
    },
    {
      label: item(gearSvg, i('settings')),
      action: function (this) {
        settingsDialog.bus.emit('show');
        this.close();
      },
    },
    Menu.Divider,
    {
      label: item(heartSvg, i('donate')),
      action: function (this) {
        donateDialog.bus.emit('show');
        this.close();
      },
    },
    {
      label: item(workspaceSvg, i('about')),
      action: function (this) {
        aboutDialog.bus.emit('show');
        this.close();
      },
    },
  ]);

  return contextMenu;
}

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const addBtn = btn({ class: 'btn-text', title: i('newWorkspace') }, [
    svg(plusSvg, '#fff', 18, 18),
  ]);
  const moreBtn = btn({ class: 'btn-text', title: i('moreActions') }, [
    svg(listSvg, '#fff', 18, 18),
  ]);
  const contextMenu = createContextMenu(bus);

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
