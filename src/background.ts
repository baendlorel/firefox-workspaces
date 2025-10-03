import '@/lib/promise-ext.js';
import { FlatPair } from './lib/flat-pair.js';
import { $lsget, $lsset, i } from './lib/ext-apis.js';
import { Action, OnUpdatedChangeInfoStatus, RandomNameLanguage, Sym, Theme } from './lib/consts.js';
import { WorkspaceManager } from './manager.js';
import { WorkspaceTab } from './lib/workspace-tab.js';
import { Workspace } from './lib/workspace.js';

class WorkspaceBackground {
  private readonly manager: WorkspaceManager;

  constructor() {
    // !! "dist/manager.js" is removed from manifest.background.scripts
    this.manager = WorkspaceManager.getInstance();
    this.init();
  }

  private async init() {
    // # init storage
    const state = (await browser.storage.local.get(null)) as WorkspaceState;
    const { workspaces = Sym.NotProvided, settings = Sym.NotProvided } = state;

    // * Init empty data
    if (workspaces === Sym.NotProvided) {
      logger.info('No workspaces found, initializing empty array');
      await $lsset({ workspaces: [] });
    }

    if (settings === Sym.NotProvided) {
      logger.info('No settings found, initializing default settings');
      await $lsset({
        settings: { theme: Theme.Auto, randomNameLanguage: RandomNameLanguage.Auto },
      });
    }

    // & Reset invalid data
    if (!Array.isArray(workspaces) || workspaces.some((w) => !Workspace.valid(w))) {
      logger.warn('Invalid workspaces data found, resetting to empty array');
      await $lsset({ workspaces: [] });
    }

    if (
      typeof settings !== 'object' ||
      settings === null ||
      typeof settings.theme !== 'string' ||
      typeof settings.randomNameLanguage !== 'string'
    ) {
      logger.warn('Invalid settings data found, resetting to default settings');
      await $lsset({
        settings: { theme: Theme.Auto, randomNameLanguage: RandomNameLanguage.Auto },
      });
    }

    // Always clear activated because it contains runtime data
    await $lsset({ workspaceToWindow: [], tabToWindow: [] });
    await this.registerListeners();
  }

  private getPopup(windowId: number) {
    return browser.extension.getViews({ type: 'popup', windowId }).find((v) => v.popup);
  }

  private registerListeners() {
    this.runtimeListeners();
    this.tabListeners();
    this.windowListeners();

    browser.contextMenus.onClicked.addListener(async (info: browser.contextMenus.OnClickData) => {
      if (info.menuItemId !== 'addToWorkspace') {
        return;
      }
      const popupUrl = browser.runtime.getURL('popup.html');
      await browser.windows
        .create({ url: popupUrl, type: 'popup', width: 1000, height: 600 })
        .fallback();
    });
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
      const workspace = this.manager.getByWindowId(windowId);
      if (!workspace) {
        return;
      }

      const tabs = await browser.tabs.query({ windowId });
      if (tabs.length === 0) {
        logger.error('WindowOnRemoved: Cannot get tabs. window id =', windowId);
        return;
      }

      workspace.tabs = tabs.map(WorkspaceTab.from);
      const workspaceToWindow = await $lsget('workspaceToWindow');
      FlatPair.delete(workspaceToWindow, windowId);
      await $lsset({ workspaceToWindow });

      const urls = workspace.tabs.map((t) => (t.pinned ? '📌' + t.url : t.url)).join(', \n');
      logger.info(`WindowOnRemoved: '${workspace.name}' removed. tabs are saved:`, urls);
    });
  }

  private tabListeners() {
    browser.tabs.onAttached.addListener(() => {
      logger.info('Attached');
      this.refreshTabContainer();
    });

    browser.tabs.onDetached.addListener(() => {
      logger.info('Detached');
      this.refreshTabContainer();
    });

    browser.tabs.onMoved.addListener(() => {
      this.refreshTabContainer();
    });

    browser.tabs.onRemoved.addListener(async (_tabId, removeInfo) => {
      if (!removeInfo.isWindowClosing) {
        this.refreshTabContainer();
      }
    });

    browser.tabs.onCreated.addListener(async (tab) => {
      this.manager.tabs.save(tab);
    });

    browser.tabs.onUpdated.addListener(async (tabId, changeInfo, _tab) => {
      if (changeInfo.status === OnUpdatedChangeInfoStatus.Complete) {
        if (!this.manager.needPin.has(tabId)) {
          return;
        }
        this.manager.needPin.delete(tabId);
        this.manager.tabs.update(tabId, { pinned: true });
        await this.recursivePin(tabId, 3);
      } else {
        await this.refreshTabContainer();
      }
    });
  }

  /**
   * [INFO] Raise the possibility of successfully pin a tab under desperation
   * - the browser seems to be unreliable in pinning a tab, even if the API call
   *   succeeds, the tab may still not be pinned.
   * - pinning multiple times in quick succession increases the chance of success.
   */
  private async recursivePin(tabId: number, attempts: number) {
    if (attempts <= 0) {
      return;
    }

    await browser.tabs.update(tabId, { pinned: true });
    const result = await browser.tabs.query({ pinned: false });
    if (result.every((t) => t.id !== tabId)) {
      return;
    }
    await this.recursivePin(tabId, attempts - 1);
  }

  private async handlePopupMessage(message: MessageRequest): Promise<MessageResponseMap[Action]> {
    const action = message.action;
    if (action === Action.GetState) {
      const state = (await browser.storage.local.get()) as WorkspaceState;
      const response: MessageResponseMap[typeof action] = { succ: true, data: state };
      return response;
    }

    if (action === Action.Get) {
      const response: MessageResponseMap[typeof action] = {
        succ: true,
        data: this.manager.workspaces.arr,
        activated: this.manager.activeWorkspaces,
      };
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

    if (action === Action.CheckPageInWorkspaces) {
      const matched = this.manager.workspaces.arr.filter((workspace) =>
        workspace.tabs.some((tab) => tab.url === message.url)
      );
      const response: MessageResponseMap[typeof action] = { succ: true, data: matched };
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

  private async refreshTabContainer() {
    const browserTabs = await browser.tabs.query({});
    this.manager.tabs.rebuild(browserTabs);
  }
}

new WorkspaceBackground();
