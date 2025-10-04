import { i, $lget, $lset, $sget, $sset, $windowWorkspace } from './lib/ext-apis.js';
import { Action, Switch, Sym, Theme } from './lib/consts.js';
import { $thm } from './lib/utils.js';
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
    const time = min < 1 ? i('justNow') : i('minutesAgo', min);
    logger.info('Updated before ' + time);

    this.manager = new WorkspaceManager();
    this.init();
  }

  private async init() {
    // # init storage
    const sync = await $sget();

    const {
      workspaces: sworkspaces = Sym.NotProvided,
      settings: ssettings = Sym.NotProvided,
      timestamp: stimestamp = Sym.NotProvided,
    } = sync;

    const local = await $lget();
    const {
      workspaces = Sym.NotProvided,
      settings = Sym.NotProvided,
      timestamp = Sym.NotProvided,
    } = local;

    // Brand new
    if (timestamp === Sym.NotProvided && stimestamp === Sym.NotProvided) {
      logger.info('No existing data found, initializing with default values');
      await this.initLocalWith({});
    } else if (timestamp === Sym.NotProvided && Number.isSafeInteger(stimestamp)) {
      logger.info('sync data found');
      await this.initLocalWith({ workspaces: sworkspaces, settings: ssettings });
    } else if (Number.isSafeInteger(timestamp) && stimestamp === Sym.NotProvided) {
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
    const { settings: realSettings } = await $lget('settings');
    if (isValidSettings(realSettings) ? realSettings.sync === Switch.On : true) {
      await this.initSync();
    }
  }

  private async initLocalWith(data: { workspaces?: unknown; settings?: unknown } = {}) {
    let { workspaces = Sym.NotProvided, settings = Sym.NotProvided } = data as any;

    if (!isValidWorkspaces(workspaces)) {
      if (workspaces !== Sym.NotProvided) {
        logger.error('data.workspaces must be Workspace[]', workspaces);
      }
      workspaces = [];
    }

    if (!isValidSettings(settings)) {
      if (settings !== Sym.NotProvided) {
        logger.error('data.settings must be Settings object', settings);
      }
      settings = { theme: Theme.Auto, sync: false };
    }

    const _workspaceWindows: Record<string, number> = {};
    const _windowTabs: Record<string, browser.tabs.Tab[]> = {};

    await $lset({ workspaces, settings, _workspaceWindows, _windowTabs, timestamp: Date.now() });
  }

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
      if ((info.status === 'complete' || info.status === 'loading') && tab) {
        await this.refreshTab({ windowId: tab.windowId });
      }
    });
  }

  private async refreshTab(info: Partial<ChangeInfo>) {
    const windowId = info.windowId ?? info.newWindowId ?? info.oldWindowId ?? Sym.NotProvided;
    if (windowId === Sym.NotProvided) {
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
      case Action.ToggleSync: {
        if (message.sync === Switch.On) {
          await this.initSync();
        } else {
          await this.stopSync();
        }
        return { succ: true };
      }
      case Action.Import: {
        await this.manager.importData(message.data);
        return { succ: true };
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

  async initSync() {
    const EVERY_X_MINUTES = 5;

    // Avoid scheduling multiple concurrent timers
    if (this.syncer !== null) {
      return;
    }
    logger.info('start sync');

    const task = async () => {
      logger.verbose('Sync storage on', $thm());

      // * Might change if more features are added
      const local = await $lget('workspaces', 'settings').catch((e) => {
        logger.error('Error while syncing, loading local', e);
        return null;
      });

      if (local === null) {
        scheduleNext();
        return;
      }

      await $sset(local).catch((e) => logger.error('Error while syncing, saving sync', e));
      scheduleNext();
    };

    const scheduleNext = () => {
      const minute = new Date().getMinutes();
      const delta = EVERY_X_MINUTES - (minute % EVERY_X_MINUTES);
      // store timer id so it can be cancelled
      this.syncer = setTimeout(task, delta * 60000);
    };

    // first schedule
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
