import '@/lib/promise-ext.js';
import { i, $lget, $lset, $sget, $sset, $windowWorkspace } from './lib/ext-apis.js';
import { Action, Sym, Theme } from './lib/consts.js';
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

  constructor() {
    const updatedAt = new Date('__DATE_TIME__');
    const delta = Date.now() - updatedAt.getTime();
    const min = Math.floor(delta / 60000);
    const time = min < 1 ? i('justNow') : i('minutesAgo', min);
    logger.info('Updated before ' + time);

    this.manager = new WorkspaceManager();
    this.init();
    this.startSyncTask();
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
  }

  private async initLocalWith(data: Partial<Local>) {
    let {
      workspaces = Sym.NotProvided,
      settings = Sym.NotProvided,
      _workspaceWindows = [],
      _windowTabs = [],
    } = data;

    if (!isValidWorkspaces(workspaces)) {
      logger.error('data.workspaceses must be Workspace[]', workspaces);
      workspaces = [];
    }

    if (!isValidSettings(settings)) {
      logger.error('data.settings must be Settings object', settings);
      settings = { theme: Theme.Auto };
    }

    $lset({ workspaces, settings, _workspaceWindows, _windowTabs });
  }

  private registerListeners() {
    this.runtimeListeners();
    this.tabListeners();
    this.windowListeners();
  }

  private runtimeListeners() {
    browser.runtime.onStartup.addListener(() => this.init());
    browser.runtime.onInstalled.addListener(() => this.init());
    browser.runtime.onMessage.addListener(
      async (message: MessageRequest): Promise<MessageResponse> =>
        this.handlePopupMessage(message).fallback('Error handling message', {
          succ: false,
          error: 'Error handling message.',
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
    browser.tabs.onCreated.addListener((tab) => this.manager.addWindowTab(tab));

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

        // todo 改成了WINDOW_ID_NONE。看看接收方需不需要改造
        const response: OpenResponse = {
          succ: data.id !== browser.windows.WINDOW_ID_NONE,
          data,
        };
        return response;
      }
      case Action.Import: {
        await this.manager.importData(message.data);
        return { succ: true } satisfies ImportResponse;
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

  private async startSyncTask() {
    const INTERVAL = 5 * 60 * 1000;
    const task = async () => {
      // * Might change if more features are added
      const local = await $lget('workspaces', 'settings');
      await $sset(local);

      setTimeout(task, INTERVAL);
    };

    setTimeout(task, INTERVAL);
  }
}

new WorkspaceBackground();
