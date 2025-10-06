import { EventBus } from 'minimal-event-bus';
import { btn, div, h, svg } from '@/lib/dom.js';
import { Color } from '@/lib/color.js';
import { i, $send } from '@/lib/ext-apis.js';
import { store } from '@/lib/storage.js';
import popupService from '@web/popup.service.js';
import { info } from '@comp/dialog/alerts.js';

import { Menu } from '@comp/menu/index.js';
import settings from '@comp/settings.js';
import { btnWithIcon } from './icon.js';
import { stringify } from './debug.js';

import arrowRepeatSvg from '@assets/arrow-repeat.svg?raw';
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
    {
      label: btnWithIcon(bugSvg, i('menu.debug-info')),
      action: async () => {
        const { workspaces } = await store.localGet('workspaces');
        logger.debug('workspaces', stringify(workspaces));
      },
    },
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
  const addBtn = btn({ class: 'btn-text', title: i('workspace.new') }, i('button.new'));
  const moreBtn = btn({ class: 'btn-text', title: i('button.more-actions') }, [
    svg(listSvg, null, 18),
  ]);
  const createMenu = createCreateMenu(bus);
  const moreActionMenu = createMoreActionMenu(bus);

  const syncIcon = svg(arrowRepeatSvg, null, 18);
  syncIcon.classList.add('sync-indicator');
  const title = h('h2', 'wb-header-title', i('workspace.title'));
  const header = div('wb-header', [title, syncIcon, addBtn, moreBtn]);

  // Sync indicator state management
  let errorMessage = '';
  let successTimeout: number | null = null;
  let syncingStartTime: number | null = null;
  const MIN_SYNCING_DURATION = 1200; // 1.2 seconds

  function setStatus(state: SyncState, errorMsg?: string) {
    if (state === SyncState.Syncing) {
      // Clear previous state
      syncIcon.classList.remove('syncing', 'success', 'error');
      if (successTimeout) {
        clearTimeout(successTimeout);
        successTimeout = null;
      }
      // Start syncing
      syncIcon.classList.add('syncing');
      syncingStartTime = Date.now();
    } else {
      // Calculate remaining time to meet minimum syncing duration
      const syncingElapsed = syncingStartTime
        ? Date.now() - syncingStartTime
        : MIN_SYNCING_DURATION;
      const remainingTime = Math.max(0, MIN_SYNCING_DURATION - syncingElapsed);

      setTimeout(() => {
        syncIcon.classList.remove('syncing', 'success', 'error');
        if (successTimeout) {
          clearTimeout(successTimeout);
          successTimeout = null;
        }

        // Set new state
        syncIcon.classList.add(state);

        if (state === SyncState.Success) {
          // Auto hide after 8 seconds
          successTimeout = window.setTimeout(() => {
            syncIcon.classList.remove('success');
          }, 8000);
        } else if (state === SyncState.Error) {
          errorMessage = errorMsg || 'Unknown sync error';
        }

        syncingStartTime = null;
      }, remainingTime);
    }
  }

  // Handle sync icon click (show error details)
  syncIcon.addEventListener('click', () => {
    if (syncIcon.classList.contains('error')) {
      info(errorMessage, i('dialog.type.danger'));
    }
  });

  // todo syncicon改成class组件
  bus.on('change-sync-state', setStatus);

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
