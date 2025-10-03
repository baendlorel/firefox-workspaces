import '@/lib/promise-ext.js';
import { $findWorkspaceByWindowId, $lsset, i } from './lib/ext-apis.js';
import { Action, OnUpdatedChangeInfoStatus, RandomNameLanguage, Sym, Theme } from './lib/consts.js';
import { WorkspaceManager } from './manager.js';
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
      const workspace = await $findWorkspaceByWindowId(windowId);
      if (!workspace) {
        return;
      }

      // todo 逻辑：1、监听标签页改动，纳入window->tabs数组。2、关闭窗口时保存标签页到workspaces数组。
      workspace.tabs = this.manager.getWindowTabs(windowId);
      await this.manager.deactivate(workspace.id);
      await this.manager.save(workspace);
    });
  }

  private tabListeners() {
    browser.tabs.onAttached.addListener((_tabId, info) => {
      logger.info('Attached');
      this.manager.refreshWindowTab(info.newWindowId);
    });

    browser.tabs.onDetached.addListener((_tabId, info) => {
      logger.info('Detached');
      this.manager.refreshWindowTab(info.oldWindowId);
    });

    browser.tabs.onMoved.addListener((_tabId, info) => {
      this.manager.refreshWindowTab(info.windowId);
    });

    browser.tabs.onRemoved.addListener(async (_tabId, info) => {
      if (info.isWindowClosing) {
        return;
      }
      this.manager.refreshWindowTab(info.windowId);
    });

    browser.tabs.onCreated.addListener(async (tab) => {
      this.manager.addWindowTab(tab);
    });

    browser.tabs.onUpdated.addListener(async (tabId, info, tab) => {
      if (info.status === OnUpdatedChangeInfoStatus.Complete) {
        if (!this.manager.needPin.has(tabId)) {
          await this.manager.refreshWindowTab(tab.windowId);
          return;
        }
        this.manager.needPin.delete(tabId);

        // & manually update
        const browserTab = this.manager.windowTabs.get(tab.windowId!)?.find((t) => t.id === tabId);
        if (!browserTab) {
          logger.error(`Tab to pin not found in cache. tab(${tabId}), window(${tab.windowId})`);
          return;
        }
        // do this before pin because possible failure, we still need it to be pinned next time
        browserTab.pinned = true;
        this.recursivePin(tabId, 3); // & won't await this, let it try
      }
      await this.manager.refreshWindowTab(tab.windowId);
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
  }
}

new WorkspaceBackground();
