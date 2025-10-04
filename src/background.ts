import '@/lib/promise-ext.js';
import { i, $lget, $lset, $sget, $sset, $windowWorkspace } from './lib/ext-apis.js';
import { Action, Consts, TabChangeStatus, Sym, Theme } from './lib/consts.js';
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

  private getPopup(windowId: number) {
    return browser.extension
      .getViews({ type: 'popup', windowId })
      .find((v) => Reflect.has(v, Consts.InjectionFlag));
  }

  private registerListeners() {
    this.runtimeListeners();
    this.tabListeners();
    this.windowListeners();
  }

  private runtimeListeners() {
    // Initialize when extension starts
    browser.runtime.onStartup.addListener(() => this.init());
    browser.runtime.onInstalled.addListener(() => this.init());

    // Handle messages from popup and content scripts
    browser.runtime.onMessage.addListener(
      async (message: MessageRequest): Promise<MessageResponseMap[Action]> =>
        this.handlePopupMessage(message).catch((error) => {
          logger.error('Error handling message', error);
          const errorResponse: ErrorResponse = { succ: false, error: 'Error handling message.' };
          return errorResponse;
        })
    );

    // Context menu setup
    browser.runtime.onInstalled.addListener(() =>
      browser.contextMenus.create({
        id: 'addToWorkspace',
        title: i('addToWorkspaces'),
      })
    );
  }

  private windowListeners() {
    // Handle window events for session management
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
    browser.tabs.onCreated.addListener(async (tab) => this.manager.addWindowTab(tab));

    // # cases of refresh
    browser.tabs.onAttached.addListener((_tabId, info) => this.refreshTab(info));
    browser.tabs.onDetached.addListener((_tabId, info) => this.refreshTab(info));
    browser.tabs.onMoved.addListener((_tabId, info) => this.refreshTab(info));
    browser.tabs.onRemoved.addListener((_tabId, info) => this.refreshTab(info));
    browser.tabs.onUpdated.addListener(async (_tabId, info, tab) => {
      if (info.status === TabChangeStatus.Complete || info.status === TabChangeStatus.Loading) {
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

  private async handlePopupMessage(message: MessageRequest): Promise<MessageResponseMap[Action]> {
    const action = message.action;
    if (action === Action.GetState) {
      const state = (await browser.storage.local.get()) as State;
      const response: MessageResponseMap[typeof action] = { succ: true, data: state };
      return response;
    }

    if (action === Action.Open) {
      const window = await this.manager
        .open(message.workspace)
        .fallback('Failed to open workspace in window:', null);

      const response: MessageResponseMap[typeof action] = {
        succ: window !== null,
        data: window === null ? { id: NaN } : { id: window.id },
      };
      return response;
    }

    if (action === Action.Import) {
      await this.manager.importData(message.data);
      const response: MessageResponseMap[typeof action] = {
        succ: true,
      };
      return response;
    }

    action satisfies never;

    // Error
    const errorResponse: ErrorResponse = {
      succ: false,
      error: 'Unknown action: ' + String(action),
    };
    return errorResponse;
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
