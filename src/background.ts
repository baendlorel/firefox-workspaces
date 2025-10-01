import './lib/promise-ext.js';
import { Action, OnUpdatedChangeInfoStatus } from './lib/consts.js';
import { WorkspaceManager } from './manager.js';

class WorkspaceBackground {
  private readonly manager: WorkspaceManager;

  constructor() {
    // WorkspaceManager is already loaded via manifest scripts
    this.manager = WorkspaceManager.getInstance();
    this.init().then(() => this.registerListeners());
  }

  private init() {
    // Restore sessions on startup
    return this.manager
      .restoreSessions()
      .then(() => logger.info('initialized in background'))
      .fallback('Failed to initialize');
  }

  private getPopup(windowId: number) {
    return browser.extension
      .getViews({ type: 'popup', windowId })
      .find((v) => typeof v.popup.isWorkspacePopupPage);
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

    // Save sessions before browser shuts down
    browser.runtime.onSuspend.addListener(async () => {
      logger.info('Saving workspace sessions before browser shutdown');
      await this.manager.saveActiveSessions();
    });

    // Handle messages from popup and content scripts
    browser.runtime.onMessage.addListener(
      async (message: MessageRequest): Promise<MessageResponse> =>
        this.handlePopupMessage(message).catch((error) => {
          logger.error('Error handling message', error);
          const errorResponse: ErrorResponse = { success: false, error: 'Error handling message.' };
          return errorResponse;
        })
    );

    // Context menu setup
    browser.runtime.onInstalled.addListener(() =>
      browser.contextMenus.create({
        id: 'addToWorkspace',
        title: 'Add to Workspaces',
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

      // Skip processing if this workspace is being deleted
      if (this.manager.workspaces.isDeleting(workspace.id)) {
        logger.debug(`WindowOnRemoved: Deleting '${workspace.name}', skip`);
        return;
      }

      const tabs = await this.manager.tabs.getTabsOfWindow(windowId);
      if (tabs.length === 0) {
        logger.error('WindowOnRemoved: Cannot get tabs. window id =', windowId);
        return;
      }

      workspace.tabs = tabs;
      workspace.windowId = undefined;
      this.manager.workspaces.deactivate(workspace.id);

      await this.manager.save();
      const urls = workspace.tabs.map((t) => (t.pinned ? '📌' + t.url : t.url)).join(', ');
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
        await browser.tabs.update(tabId, { pinned: true });
      } else {
        await this.refreshTabContainer();
      }
    });
  }

  private async handlePopupMessage(message: MessageRequest): Promise<MessageResponse> {
    const action = message.action;
    if (action === Action.GetWorkspaces) {
      const response: MessageResponseMap[typeof action] = {
        success: true,
        data: this.manager.workspaces.arr,
        activeWorkspaces: this.manager.activeWorkspaces,
      };
      return response;
    }

    if (action === Action.CreateWorkspace) {
      const newWorkspace = await this.manager.create(message.name, message.color);
      const response: MessageResponseMap[typeof action] = {
        success: true,
        data: newWorkspace,
      };
      return response;
    }

    if (action === Action.UpdateWorkspace) {
      const updated = await this.manager.update(message.id, message.updates);
      const response: MessageResponseMap[typeof action] = {
        success: updated !== null,
        data: updated,
      };
      return response;
    }

    if (action === Action.DeleteWorkspace) {
      const deleted = await this.manager.delete(message.id);
      const response: MessageResponseMap[typeof action] = { success: deleted };
      return response;
    }

    if (action === Action.RemoveTab) {
      const removed = await this.manager.removeTab(message.workspaceId, message.tabId);
      const response: MessageResponseMap[typeof action] = { success: removed };
      return response;
    }

    if (action === Action.TogglePin) {
      const pinToggled = await this.manager.toggleTabPin(message.workspaceId, message.tabId);
      const response: MessageResponseMap[typeof action] = { success: pinToggled };
      return response;
    }

    if (action === Action.OpenWorkspace) {
      const window = await this.manager
        .open(message.workspaceId)
        .fallback('Failed to open workspace in window:', null);

      const response: MessageResponseMap[typeof action] = {
        success: window !== null,
        data: window === null ? { id: NaN } : { id: window.id },
      };
      return response;
    }

    if (action === Action.MoveTab) {
      const moved = await this.manager.moveTabBetweenWorkspaces(
        message.fromWorkspaceId,
        message.toWorkspaceId,
        message.tabId
      );
      const response: MessageResponseMap[typeof action] = { success: moved };
      return response;
    }

    if (action === Action.GetStats) {
      const stats = this.manager.getStats(message.workspaceId);
      const response: MessageResponseMap[typeof action] = {
        success: stats !== null,
        data: stats,
      };
      return response;
    }

    if (action === Action.CheckPageInWorkspaces) {
      const matched = this.manager.workspaces.arr.filter((workspace) =>
        workspace.tabs.some((tab) => tab.url === message.url)
      );
      const response: MessageResponseMap[typeof action] = { success: true, data: matched };
      return response;
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: 'Unknown action: ' + String(action),
    };
    return errorResponse;
  }

  private async refreshTabContainer() {
    const browserTabs = await browser.tabs.query({});
    this.manager.tabs.rebuild(browserTabs);
  }

  /**
   * Periodically save workspace states for active windows
   */
  private async periodicallySave() {
    const INTERVAL = 5 * 60 * 1000; // 5 minutes
    const fn = async () => {
      logger.debug('Periodic save of active workspace sessions');
      await this.manager.saveActiveSessions();
      setTimeout(fn, INTERVAL);
    };
    setTimeout(fn, INTERVAL);
  }
}

new WorkspaceBackground();
