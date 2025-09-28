import { Action } from './lib/consts.js';
import { $mergeTabInfo } from './lib/utils.js';
import { WorkspaceManager } from './manager.js';

// Background script for Workspaces extension
let manager: WorkspaceManager;

// Initialize when extension starts
browser.runtime.onStartup.addListener(init);

browser.runtime.onInstalled.addListener(init);

async function init() {
  // WorkspaceManager is already loaded via manifest scripts
  try {
    manager = WorkspaceManager.getInstance();

    // Restore sessions on startup
    await manager.restoreSessions();

    console.log('Workspaces Manager initialized in background');
  } catch (error) {
    console.error('[__NAME__: __func__] Failed to initialize Workspaces Manager:', error);
  }
}

// Handle window events for session management
browser.windows.onRemoved.addListener(async (windowId) => {
  if (!manager) {
    return;
  }

  // Check if this window belongs to a workspace
  const workspace = manager.getByWindowId(windowId);
  if (workspace) {
    console.log(`Workspace window closed: ${workspace.name}`);

    try {
      // ?? First save the current state of tabs before clearing window association
      await manager.updateByWindowId(workspace.id, windowId);
      console.log(`Saved workspace session for: ${workspace.name}`);
    } catch (error) {
      console.error(`Failed to save workspace session for: ${workspace.name}`, error);
    }

    // Clear window association and remove from active list
    workspace.windowId = undefined;
    manager.deactivate(workspace.id);
    await manager.save();

    console.log(`Workspace ${workspace.name} removed from active list`);
  }
});

// Track window focus changes to update workspace states
browser.windows.onFocusChanged.addListener(async (windowId) => {
  if (!manager || windowId === browser.windows.WINDOW_ID_NONE) return;

  const workspace = manager.getByWindowId(windowId);
  if (workspace) {
    // Update workspace's last accessed time
    workspace.lastOpened = Date.now();
    await manager.save();
  }
});

// todo 此处可能不需要这样
// Periodically save workspace states for active windows
setInterval(async () => {
  if (!manager) {
    return;
  }

  const workspaces = manager.workspaces;
  for (let i = 0; i < workspaces.length; i++) {
    const workspace = workspaces[i];
    if (workspace.windowId === undefined) {
      continue;
    }
    try {
      // Verify window still exists
      const windows = await browser.windows.getAll();
      const windowExists = windows.some((w) => w.id === workspace.windowId);

      if (windowExists) {
        await manager.updateByWindowId(workspace.id, workspace.windowId);
      } else {
        // Window was closed but event wasn't caught
        workspace.windowId = undefined;
        manager.deactivate(workspace.id);
        await manager.save();
      }
    } catch (error) {
      console.error('[__NAME__: __func__] Error during periodic save:', error);
    }
  }
}, 30000); // Save every 30 seconds

// Save sessions before browser shuts down
browser.runtime.onSuspend.addListener(async () => {
  if (manager) {
    console.log('Saving workspace sessions before browser shutdown');
    await manager.saveActiveSessions();
  }
});

// Save workspace sessions periodically and on important events
browser.tabs.onAttached.addListener(async (tabId, attachInfo) => {
  if (!manager) return;

  const workspace = manager.getByWindowId(attachInfo.newWindowId);
  if (workspace) {
    // Tab was moved to a workspace window
    setTimeout(() => {
      manager.updateByWindowId(workspace.id, attachInfo.newWindowId);
    }, 1000);
  }
});

browser.tabs.onDetached.addListener(async (tabId, detachInfo) => {
  if (!manager) return;

  const workspace = manager.getByWindowId(detachInfo.oldWindowId);
  if (workspace) {
    // Tab was moved from a workspace window
    setTimeout(() => {
      manager.updateByWindowId(workspace.id, detachInfo.oldWindowId);
    }, 1000);
  }
});

// Handle tab events
browser.tabs.onCreated.addListener(async (tab) => {
  if (!manager) {
    return;
  }

  if (tab.windowId === undefined) {
    alert('[__NAME__: __func__] Tab created without windowId. ' + JSON.stringify(tab));
    return;
  }

  // Check if tab was created in a workspace window
  const workspace = manager.getByWindowId(tab.windowId);
  if (workspace) {
    console.log(`New tab created in workspace: ${workspace.name}`);
    // The tab will be saved when the window is closed or manually updated
  }
});

browser.tabs.onRemoved.addListener(async (_tabId, removeInfo) => {
  if (!manager) {
    return;
  }

  // Update work groups if tab was removed from a workspace window
  const workspace = manager.getByWindowId(removeInfo.windowId);
  if (workspace && !removeInfo.isWindowClosing) {
    // Update workspace state immediately when individual tab is closed
    await manager.updateByWindowId(workspace.id, removeInfo.windowId);
  }
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, browserTab) => {
  if (!manager) {
    return;
  }

  if (browserTab.windowId === undefined) {
    alert('[__NAME__: __func__] Tab created without windowId. ' + JSON.stringify(browserTab));
    return;
  }

  // Update workspace if tab URL or title changed in a workspace window
  if (changeInfo.url || changeInfo.title) {
    const workspace = manager.getByWindowId(browserTab.windowId);
    if (workspace) {
      // Update the specific tab in the workspace
      const updateTab = (tabs: TabInfo[]) => {
        const index = tabs.findIndex((t) => t.id === tabId);
        if (index !== -1) {
          $mergeTabInfo(tabs[index], browserTab);
          return true;
        }
        return false;
      };

      const updated = updateTab(workspace.tabs) || updateTab(workspace.pinnedTabs);
      if (updated) {
        await manager.save();
      }
    }
  }
});

// Handle messages from popup and content scripts
browser.runtime.onMessage.addListener(async (message: MessageRequest): Promise<MessageResponse> => {
  if (!manager) {
    await init();
  }

  const action = message.action;
  try {
    switch (action) {
      case Action.GetWorkspaces:
        const response: MessageResponseMap[typeof action] = {
          success: true,
          data: manager.workspaces,
          activeWorkspaces: manager.activeWorkspaces,
        };
        return response;

      case Action.CreateWorkspaces:
        const newWorkspace = await manager.create(message.name, message.color);
        const response: MessageResponseMap[typeof action] = {
          success: true,
          data: newWorkspace,
        };
        return response;

      case Action.UpdateWorkspaces:
        const updated = await manager.update(message.id, message.updates);
        respond<UpdateWorkspacesResponse>({ success: updated !== null, data: updated });
        break;

      case Action.DeleteWorkspaces:
        const deleted = await manager.delete(message.id);
        respond<DeleteWorkspacesResponse>({ success: deleted });
        break;

      case Action.AddCurrentTab:
        const currentTab = await browser.tabs.query({ active: true, currentWindow: true });

        if (currentTab[0]) {
          const added = await manager.addTab(message.workspaceId, currentTab[0], message.pinned);
          respond<AddCurrentTabResponse>({ success: added });
        } else {
          respond<AddCurrentTabResponse>({ success: false, error: 'No active tab found' });
        }
        break;

      case Action.RemoveTab:
        const removed = await manager.removeTab(message.workspaceId, message.tabId);
        respond<RemoveTabResponse>({ success: removed });
        break;

      case Action.TogglePin:
        const pinToggled = await manager.toggleTabPin(message.workspaceId, message.tabId);
        respond<TogglePinResponse>({ success: pinToggled });
        break;

      case Action.OpenWorkspaces:
        const window = await manager.open(message.workspaceId);
        respond<OpenWorkspacesResponse>({ success: window !== null, data: window });
        break;

      case Action.MoveTab:
        const moved = await manager.moveTabBetweenWorkspaces(
          message.fromWorkspaceId,
          message.toWorkspaceId,
          message.tabId
        );
        respond<MoveTabResponse>({ success: moved });
        break;

      case Action.GetStats:
        const stats = manager.getStats(message.workspaceId);
        respond<GetStatsResponse>({ success: stats !== null, data: stats });
        break;

      case Action.CheckPageInGroups:
        const matched = manager.workspaces.filter((workspace) => {
          for (let i = 0; i < workspace.pinnedTabs.length; i++) {
            if (workspace.pinnedTabs[i].url === message.url) {
              return true;
            }
          }
          for (let i = 0; i < workspace.tabs.length; i++) {
            if (workspace.tabs[i].url === message.url) {
              return true;
            }
          }
          return false;
        });
        respond<CheckPageInGroupsResponse>({ success: true, groups: matched });
        break;

      default:
        respond<UnknownActionResponse>({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('[__NAME__: __func__] Error handling message:', error);
    respond({ success: false });
  }

  return true; // Keep message channel open for async response
});

// Context menu setup
browser.runtime.onInstalled.addListener(() => {
  // Create context menu item for adding current tab to workspace
  browser.contextMenus.create({
    id: 'addToWorkspaces',
    title: 'Add to Workspaces',
    contexts: ['page'],
  });
});

async function backgroundOnClickListener(info: browser.contextMenus.OnClickData) {
  if (info.menuItemId === 'addToWorkspaces') {
    // Open popup to select workspace
    // This could be enhanced with a submenu showing available groups
    // browser.browserAction.openPopup() is not implemented in Firefox (and
    // can be disallowed in Manifest V3). To keep compatibility, open the
    // extension popup page in a small popup window instead.
    try {
      const popupUrl = browser.runtime.getURL('popup.html');
      await browser.windows.create({ url: popupUrl, type: 'popup', width: 400, height: 600 });
    } catch (error) {
      console.error(`[__NAME__: __func__] `, error);
    }
  }
}

browser.contextMenus.onClicked.addListener(backgroundOnClickListener);
