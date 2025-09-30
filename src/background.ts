import './lib/promise-ext.js';
import { Action } from './lib/consts.js';
import { $createTabInfo, $mergeTabInfo } from './lib/utils.js';
import { WorkspaceManager } from './manager.js';

class WorkspaceBackground {
  private readonly manager: WorkspaceManager;

  constructor() {
    // WorkspaceManager is already loaded via manifest scripts
    this.manager = WorkspaceManager.getInstance();
    this.init().then(() => this.registerListeners());
    this.periodicallySave();
  }

  private init() {
    // Restore sessions on startup
    return this.manager
      .restoreSessions()
      .then(() => console.log('__NAME__ initialized in background'))
      .fallback('Failed to initialize');
  }

  private registerListeners() {
    // Initialize when extension starts
    browser.runtime.onStartup.addListener(() => this.init());
    browser.runtime.onInstalled.addListener(() => this.init());

    // Handle window events for session management
    browser.windows.onRemoved.addListener(async (windowId) => {
      // Check if this window belongs to a workspace
      const workspace = this.manager.getByWindowId(windowId);
      if (!workspace) {
        return;
      }

      console.log(`Workspace window closed: ${workspace.name}`);
      // Skip processing if this workspace is being deleted
      if (this.manager.isDeleting(workspace.id)) {
        console.log(`Workspace ${workspace.name} is being deleted, skipping window close handling`);
      }

      const tabs = await browser.tabs.query({ windowId });
      workspace.tabs = tabs.map($createTabInfo);
      workspace.windowId = undefined;
      this.manager.deactivate(workspace.id);
      await this.manager.save();

      // fixme 没有自动保存tab
      console.log(`Workspace ${workspace.name} removed from active list`);
    });

    // Track window focus changes to update workspace states
    browser.windows.onFocusChanged.addListener(async (windowId) => {
      if (windowId === browser.windows.WINDOW_ID_NONE) {
        return;
      }

      const workspace = this.manager.getByWindowId(windowId);
      if (!workspace) {
        return;
      }

      // Update workspace's last accessed time
      workspace.lastOpened = Date.now();
      await this.manager.save();

      // Notify all popup windows about the focus change
      const notification: WindowFocusChangedNotification = {
        action: Action.WindowFocusChanged,
        windowId,
        workspace,
      };

      // Send message to all extension pages (popup, options, etc.)
      browser.extension.getViews({ type: 'popup' }).some((view) => {
        const handler = view.popup?.onWindowFocusChanged;
        if (typeof handler !== 'function') {
          return false;
        }
        handler.call(view.popup, notification);
        return true;
      });
    });

    // Save sessions before browser shuts down
    browser.runtime.onSuspend.addListener(async () => {
      console.log('Saving workspace sessions before browser shutdown');
      await this.manager.saveActiveSessions();
    });

    type OnTachedInfo = browser.tabs._OnAttachedAttachInfo | browser.tabs._OnDetachedDetachInfo;
    const onTached = async (_tabId: number, info: OnTachedInfo) => {
      const windowId = 'newWindowId' in info ? info.newWindowId : info.oldWindowId;
      const workspace = this.manager.getByWindowId(windowId);
      if (workspace) {
        // Tab was moved to a workspace window
        setTimeout(() => this.manager.updateByWindowId(workspace.id, windowId), 1000);
      }
    };

    // Save workspace sessions periodically and on important events
    browser.tabs.onAttached.addListener(onTached);
    browser.tabs.onDetached.addListener(onTached);

    // Handle tab events
    browser.tabs.onCreated.addListener(async (tab) => {
      if (tab.windowId === undefined) {
        browser.notifications.create({
          type: 'basic',
          title: '[__NAME__] onCreated',
          message: 'Tab created without windowId. ' + JSON.stringify(tab),
        });
      }
    });

    browser.tabs.onRemoved.addListener(async (_tabId, removeInfo) => {
      // Update work groups if tab was removed from a workspace window
      const workspace = this.manager.getByWindowId(removeInfo.windowId);
      if (workspace && !removeInfo.isWindowClosing) {
        // Update workspace state immediately when individual tab is closed
        await this.manager.updateByWindowId(workspace.id, removeInfo.windowId);
      }
    });

    browser.tabs.onUpdated.addListener(async (tabId, changeInfo, browserTab) => {
      if (browserTab.windowId === undefined) {
        browser.notifications.create({
          type: 'basic',
          title: '[__NAME__] onUpdated',
          message: 'Tab created without windowId. ' + JSON.stringify(browserTab),
        });
        return;
      }

      // Update workspace if tab URL or title changed in a workspace window
      if (!changeInfo.url && !changeInfo.title) {
        return;
      }

      const workspace = this.manager.getByWindowId(browserTab.windowId);
      if (!workspace) {
        return;
      }

      // Update the specific tab in the workspace
      const index = workspace.tabs.findIndex((t) => t.id === tabId);
      if (index !== -1) {
        workspace.tabs[index] = $mergeTabInfo(workspace.tabs[index], browserTab);
        await this.manager.save();
      }
    });

    // Handle messages from popup and content scripts
    browser.runtime.onMessage.addListener(
      async (message: MessageRequest): Promise<MessageResponse> =>
        this.handlePopupMessage(message).catch((error) => {
          console.error('[__NAME__] onMessage: Error handling message', error);
          const errorResponse: ErrorResponse = { success: false, error: 'Error handling message.' };
          return errorResponse;
        })
    );

    // Context menu setup
    browser.runtime.onInstalled.addListener(() =>
      browser.contextMenus.create({
        id: 'addToWorkspace',
        title: 'Add to Workspaces',
        contexts: ['page'],
      })
    );

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

  private async handlePopupMessage(message: MessageRequest): Promise<MessageResponse> {
    const action = message.action;
    if (action === Action.GetWorkspaces) {
      const response: MessageResponseMap[typeof action] = {
        success: true,
        data: this.manager.workspaces,
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
        data: window,
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
      const matched = this.manager.workspaces.filter((workspace) =>
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

  /**
   * Periodically save workspace states for active windows
   */
  private periodicallySave() {
    const callback = async () => {
      console.log('Periodic save of active workspace sessions');

      const workspaces = this.manager.workspaces;
      for (let i = 0; i < workspaces.length; i++) {
        const workspace = workspaces[i];
        if (workspace.windowId === undefined) {
          continue;
        }

        // Verify window still exists
        const windows = await browser.windows.getAll();
        const windowExists = windows.some((w) => w.id === workspace.windowId);

        if (windowExists) {
          await this.manager.updateByWindowId(workspace.id, workspace.windowId);
          continue;
        }

        // Window was closed but event wasn't caught
        workspace.windowId = undefined;
        this.manager.deactivate(workspace.id);
        await this.manager.save();
      }

      setTimeout(callback, 60000);
    };
    setTimeout(callback, 60000);
  }
}

new WorkspaceBackground();
