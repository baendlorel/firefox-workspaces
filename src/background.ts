import { i, $windowWorkspace, $notify } from './lib/polyfilled-api.js';

import { store } from './lib/storage.js';
import { NotProvided } from './lib/consts.js';
import { $sleep, $thm } from './lib/utils.js';
import { isValidWorkspaces } from './lib/workspace.js';
import { isValidSettings } from './lib/settings.js';

import { WorkspaceManager } from './manager.js';

type ChangeInfo = browser.tabs._OnUpdatedChangeInfo &
  browser.tabs._OnAttachedAttachInfo &
  browser.tabs._OnMovedMoveInfo &
  browser.tabs._OnRemovedRemoveInfo &
  browser.tabs._OnDetachedDetachInfo;

class WorkspaceBackground {
  private readonly manager: WorkspaceManager;
  private syncer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const updatedAt = new Date('__DATE_TIME__');
    const delta = Date.now() - updatedAt.getTime();
    const min = Math.floor(delta / 60000);
    const time = min < 1 ? i('time.just-now') : i('time.minutes-ago', min);
    logger.info('Updated before ' + time);

    this.manager = new WorkspaceManager();
    this.init();
  }

  private async init() {
    // # init storage
    const sync = await store.syncGet();

    const {
      workspaces: sworkspaces = NotProvided,
      settings: ssettings = NotProvided,
      timestamp: stimestamp = NotProvided,
    } = sync;

    const local = await store.localGet();
    const { workspaces = NotProvided, settings = NotProvided, timestamp = NotProvided } = local;

    // pattern matching
    if (timestamp === NotProvided && stimestamp === NotProvided) {
      logger.info('No existing data found, initializing with default values');
      await this.initLocalWith({});
    } else if (timestamp === NotProvided && Number.isSafeInteger(stimestamp)) {
      logger.info('sync data found');
      await this.initLocalWith({ workspaces: sworkspaces, settings: ssettings });
    } else if (Number.isSafeInteger(timestamp) && stimestamp === NotProvided) {
      logger.info('local data found');
      await this.initLocalWith({ workspaces, settings });
    } else if (Number.isSafeInteger(timestamp) && Number.isSafeInteger(stimestamp)) {
      logger.info('local/sync found', timestamp > stimestamp ? 'local' : 'sync', 'is newer');
      if (timestamp > stimestamp) {
        await this.initLocalWith({ workspaces, settings });
      } else {
        await this.initLocalWith({ workspaces: sworkspaces, settings: ssettings });
      }
    } else {
      logger.warn('Invalid timestamps, re-initializing with default values');
      await this.initLocalWith({});
    }

    await this.registerListeners();

    // # start sync if enabled
    const { settings: realSettings } = await store.localGet('settings');
    if (isValidSettings(realSettings) ? realSettings.sync === Switch.On : true) {
      await this.initSync();
    }
  }

  private async initLocalWith(data: { workspaces?: unknown; settings?: unknown } = {}) {
    let { workspaces = NotProvided, settings = NotProvided } = data as any;

    if (!isValidWorkspaces(workspaces)) {
      if (workspaces !== NotProvided) {
        logger.error('data.workspaces must be Workspace[]', workspaces);
      }
      workspaces = [] satisfies Workspace[];
    }

    if (!isValidSettings(settings)) {
      if (settings !== NotProvided) {
        logger.error('data.settings must be Settings object', settings);
      }
      settings = { theme: Theme.Auto, sync: Switch.On } satisfies Settings;
    }

    const _workspaceWindows: Record<string, number> = {};
    const _windowTabs: Record<string, browser.tabs.Tab[]> = {};

    await store.localPersistSet({ workspaces, settings });
    await store.localStateSet({ _workspaceWindows, _windowTabs });
  }

  // # listeners
  private registerListeners() {
    this.runtimeListeners();
    this.tabListeners();
    this.windowListeners();
  }

  private runtimeListeners() {
    browser.runtime.onStartup.addListener(() => this.init());
    browser.runtime.onInstalled.addListener(() => this.init());
    browser.runtime.onMessage.addListener(async (message) =>
      this.handlePopupMessage(message).catch((e) => {
        logger.error('onMessage Error', e);
        return { succ: false, error: 'Error handling message.' };
      })
    );
  }

  private windowListeners() {
    browser.windows.onRemoved.addListener(async (windowId) => {
      // Check if this window belongs to a workspace
      const workspace = await $windowWorkspace(windowId);
      if (!workspace) {
        return;
      }

      workspace.tabs = await this.manager.getWindowTabs(windowId);
      await this.manager.deactivate(workspace.id);
      await this.manager.save(workspace);
    });
  }

  private tabListeners() {
    browser.tabs.onCreated.addListener((tab) => this.manager.addTabToWindow(tab));

    // # cases of refresh
    browser.tabs.onAttached.addListener((_tabId, info) => this.refreshTab(info));
    browser.tabs.onDetached.addListener((_tabId, info) => this.refreshTab(info));
    browser.tabs.onMoved.addListener((_tabId, info) => this.refreshTab(info));
    browser.tabs.onRemoved.addListener((_tabId, info) => this.refreshTab(info));
    browser.tabs.onUpdated.addListener(async (_tabId, info, tab) => {
      if (Object.keys(info).length === 1 && info.pinned !== undefined) {
        logger.info('pinchanged', info.pinned, tab);
        // Find and save the tab's pinned state
        if (tab && tab.windowId !== undefined) {
          await this.updateTabPinned(tab.windowId, tab.id!, info.pinned);
        }
        return;
      }

      if ((info.status === 'complete' || info.status === 'loading') && tab) {
        await this.refreshTab({ windowId: tab.windowId });
      }
    });
  }

  // # helpers
  private async updateTabPinned(windowId: number, tabId: number, pinned: boolean) {
    // Check if this window belongs to a workspace
    const workspace = await $windowWorkspace(windowId);
    if (!workspace) {
      return;
    }

    // Find the tab in workspace by tabId and update its pinned state
    const tab = workspace.tabs.find((t) => t.id === tabId);
    if (tab) {
      tab.pinned = pinned;
      await this.manager.save(workspace);
      logger.info('Updated tab pinned state:', tabId, 'pinned:', pinned);
    } else {
      logger.warn('Tab not found in workspace:', tabId);
    }
  }

  private async togglePin(windowId: number, tab: browser.tabs.Tab) {}

  private async refreshTab(info: Partial<ChangeInfo>) {
    const windowId = info.windowId ?? info.newWindowId ?? info.oldWindowId ?? NotProvided;
    if (windowId === NotProvided) {
      return;
    }

    // isWindowClosing would be false or undefined
    if (!info.isWindowClosing) {
      await this.manager.refreshWindowTab(windowId);
    }
  }

  private async handlePopupMessage(message: MessageRequest): Promise<MessageResponse> {
    switch (message.action) {
      case Action.Open: {
        const data = await this.manager.open(message.workspace);
        return { succ: data.id !== browser.windows.WINDOW_ID_NONE };
      }

      case Action.ToggleSync:
        if (message.sync === Switch.On) {
          await this.initSync();
        } else {
          await this.stopSync();
        }
        return { succ: true };

      case Action.Export:
        await this.manager.saveAllTab();
        return { succ: true };

      case Action.OpenPage:
        await this.openPage(message.page);
        return { succ: true };

      case Action.ReturnFileData: {
        const data = JSON.parse(message.data as string) as ExportData;
        const result = await this.manager.importData(data);
        $notify(result.message);
        return result;
      }

      default:
        message satisfies never;
        break;
    }

    // Error
    return {
      succ: false,
      error: 'Unknown message: ' + String(message),
    };
  }

  private openPage(fileName: PopupPage) {
    const wh: { [k in PopupPage]: { width: number; height: number } } = {
      [PopupPage.Import]: { width: 475, height: 465 },
      [PopupPage.Donate]: { width: 475, height: 705 },
      [PopupPage.About]: { width: 800, height: 740 },
      [PopupPage.Export]: { width: 520, height: 740 },
    };

    return browser.windows.create({
      url: `dist/pages/${fileName}.html`,
      type: 'popup',
      ...wh[fileName],
    });
  }

  private setSyncState(state: SyncState, errorMsg: string = '') {
    const w = browser.extension.getViews({ type: 'popup' }).find((w) => w.popup);
    if (!w) {
      logger.info('Popup not opened, will not update sync state');
      return;
    }
    w.popup.emit('change-sync-state', state, errorMsg);
  }

  async initSync() {
    // Avoid scheduling multiple concurrent timers
    if (this.syncer !== null) {
      return;
    }

    const task = async () => {
      try {
        this.setSyncState(SyncState.Syncing);
        logger.verbose('Sync storage on', $thm());

        // * Might change if more features are added
        const local = await store.localGet('workspaces', 'settings');
        await store.syncSet(local);
        await $sleep(500);
        this.setSyncState(SyncState.Success);
      } catch (error) {
        this.setSyncState(SyncState.Error, error instanceof Error ? error.message : String(error));
      } finally {
        scheduleNext();
      }
    };

    const scheduleNext = () => {
      const delta = Consts.SyncInterval - (new Date().getMinutes() % Consts.SyncInterval);
      this.syncer = setTimeout(task, delta * 60000);
    };

    // first schedule
    logger.info('start sync');
    scheduleNext();
  }

  async stopSync() {
    if (this.syncer !== null) {
      logger.info('stop sync');
      clearTimeout(this.syncer);
      this.syncer = null;
    }
  }
}

new WorkspaceBackground();
