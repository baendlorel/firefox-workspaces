import '@/lib/promise-ext.js';
import { $findWorkspaceByWindowId, $lsset, i } from './lib/ext-apis.js';
import { Action, Consts, TabChangeStatus, RandomNameLang, Sym, Theme } from './lib/consts.js';
import { WorkspaceManager } from './manager.js';
import { isValidWorkspace } from './lib/workspace.js';

type ChangeInfo = Merge<
  Merge<
    Merge<
      Merge<browser.tabs._OnUpdatedChangeInfo, browser.tabs._OnAttachedAttachInfo>,
      browser.tabs._OnMovedMoveInfo
    >,
    browser.tabs._OnRemovedRemoveInfo
  >,
  browser.tabs._OnDetachedDetachInfo
>;

class WorkspaceBackground {
  private readonly manager: WorkspaceManager = new WorkspaceManager();

  constructor() {
    this.init();
  }

  private async init() {
    // # init storage
    const state = (await browser.storage.local.get(null)) as State;
    const { workspaces = Sym.NotProvided, settings = Sym.NotProvided } = state;

    // * Init empty data
    if (workspaces === Sym.NotProvided) {
      logger.info('No workspaces found, initializing empty array');
      await $lsset({ workspaces: [] });
    }

    if (settings === Sym.NotProvided) {
      logger.info('No settings found, initializing default settings');
      await $lsset({
        settings: { theme: Theme.Auto, randomNameLang: RandomNameLang.Auto },
      });
    }

    // & Reset invalid data
    if (!Array.isArray(workspaces) || workspaces.some((w) => !isValidWorkspace(w))) {
      logger.warn('Invalid workspaces data found, resetting to empty array');
      await $lsset({ workspaces: [] });
    }

    if (
      typeof settings !== 'object' ||
      settings === null ||
      typeof settings.theme !== 'string' ||
      typeof settings.randomNameLang !== 'string'
    ) {
      logger.warn('Invalid settings data found, resetting to default settings');
      await $lsset({
        settings: { theme: Theme.Auto, randomNameLang: RandomNameLang.Auto },
      });
    }

    // Always clear activated because it contains runtime data
    await $lsset({ workspaceToWindow: [], tabToWindow: [] });
    await this.registerListeners();
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
      const workspace = await $findWorkspaceByWindowId(windowId);
      if (!workspace) {
        return;
      }

      workspace.tabs = this.manager.getWindowTabs(windowId);
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

  private async refreshTab(info: ChangeInfo) {
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
}

new WorkspaceBackground();
