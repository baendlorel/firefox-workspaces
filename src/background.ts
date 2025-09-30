import { Action } from './lib/consts.js';
import { $mergeTabInfo, reject } from './lib/utils.js';
import { WorkspaceManager } from './manager.js';

// todo 是否改用定义class的方法来确保manager存在？
// Background script for Workspace extension
let manager: WorkspaceManager;

// Initialize when extension starts
browser.runtime.onStartup.addListener(init);

browser.runtime.onInstalled.addListener(init);

async function init() {
  // WorkspaceManager is already loaded via manifest scripts
  manager = WorkspaceManager.getInstance();

  // Restore sessions on startup
  await manager
    .restoreSessions()
    .then(() => console.log('__NAME__ initialized in background'))
    .fallback('Failed to initialize');
}

// Handle window events for session management
browser.windows.onRemoved.addListener(async (windowId) => {
  if (!manager) {
    return;
  }

  // Check if this window belongs to a workspace
  const workspace = manager.getByWindowId(windowId);
  if (!workspace) {
    return;
  }
  console.log(`Workspace window closed: ${workspace.name}`);

  // Skip processing if this workspace is being deleted
  if (manager.isDeleting(workspace.id)) {
    console.log(`Workspace ${workspace.name} is being deleted, skipping window close handling`);
  }

  // ?? First save the current state of tabs before clearing window association
  await manager
    .updateByWindowId(workspace.id, windowId)
    .then(() => console.log(`Saved workspace session for: ${workspace.name}`))
    .fallback(`Failed to save workspace session for: ${workspace.name}`);

  // Clear window association and remove from active list
  workspace.windowId = undefined;
  manager.deactivate(workspace.id);
  await manager.save();

  console.log(`Workspace ${workspace.name} removed from active list`);
});

// Track window focus changes to update workspace states
browser.windows.onFocusChanged.addListener(async (windowId) => {
  if (!manager || windowId === browser.windows.WINDOW_ID_NONE) {
    return;
  }

  const workspace = manager.getByWindowId(windowId);
  if (!workspace) {
    return;
  }

  // Update workspace's last accessed time
  workspace.lastOpened = Date.now();
  await manager.save();

  // & Already do this on creating the window
  // const icon = await loadIcon(workspace.color);
  // browser.action.setIcon({ imageData: icon });
  // browser.action.setBadgeBackgroundColor({ color: workspace.color, windowId });
  // browser.action.setBadgeText({ text: workspace.name.slice(0, 2), windowId });
  // browser.action.setBadgeTextColor({ color: 'white', windowId });

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

    // Verify window still exists
    const windows = await browser.windows.getAll();
    const windowExists = windows.some((w) => w.id === workspace.windowId);

    if (windowExists) {
      await manager.updateByWindowId(workspace.id, workspace.windowId);
      continue;
    }

    // Window was closed but event wasn't caught
    workspace.windowId = undefined;
    manager.deactivate(workspace.id);
    await manager.save();
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
  if (!manager) {
    return;
  }

  const workspace = manager.getByWindowId(attachInfo.newWindowId);
  if (workspace) {
    // Tab was moved to a workspace window
    setTimeout(() => {
      manager.updateByWindowId(workspace.id, attachInfo.newWindowId);
    }, 1000);
  }
});

browser.tabs.onDetached.addListener(async (tabId, detachInfo) => {
  if (!manager) {
    return;
  }

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
    alert('[__NAME__] __func__: Tab created without windowId. ' + JSON.stringify(tab));
    return;
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
    alert('[__NAME__] __func__: Tab created without windowId. ' + JSON.stringify(browserTab));
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

const handlePopupMessage = async (message: MessageRequest): Promise<MessageResponse> => {
  const action = message.action;
  if (action === Action.GetWorkspaces) {
    const response: MessageResponseMap[typeof action] = {
      success: true,
      data: manager.workspaces,
      activeWorkspaces: manager.activeWorkspaces,
    };
    return response;
  }

  if (action === Action.CreateWorkspace) {
    const newWorkspace = await manager.create(message.name, message.color);
    const response: MessageResponseMap[typeof action] = {
      success: true,
      data: newWorkspace,
    };
    return response;
  }

  if (action === Action.UpdateWorkspace) {
    const updated = await manager.update(message.id, message.updates);
    const response: MessageResponseMap[typeof action] = {
      success: updated !== null,
      data: updated,
    };
    return response;
  }

  if (action === Action.DeleteWorkspace) {
    const deleted = await manager.delete(message.id);
    const response: MessageResponseMap[typeof action] = { success: deleted };
    return response;
  }

  if (action === Action.AddCurrentTab) {
    const currentTab = await browser.tabs.query({ active: true, currentWindow: true });

    if (currentTab[0]) {
      const added = await manager.addTab(message.workspaceId, currentTab[0], message.pinned);
      const response: MessageResponseMap[typeof action] = { success: added };
      return response;
    } else {
      const response: MessageResponseMap[typeof action] = {
        success: false,
        error: 'No active tab found',
      };
      return response;
    }
  }

  if (action === Action.RemoveTab) {
    const removed = await manager.removeTab(message.workspaceId, message.tabId);
    const response: MessageResponseMap[typeof action] = { success: removed };
    return response;
  }

  if (action === Action.TogglePin) {
    const pinToggled = await manager.toggleTabPin(message.workspaceId, message.tabId);
    const response: MessageResponseMap[typeof action] = { success: pinToggled };
    return response;
  }

  if (action === Action.OpenWorkspace) {
    const window = await manager
      .open(message.workspaceId)
      .fallback('Failed to open workspace in window:', null);
    const response: MessageResponseMap[typeof action] = {
      success: window !== null,
      data: window,
    };
    return response;
  }

  if (action === Action.MoveTab) {
    const moved = await manager.moveTabBetweenWorkspaces(
      message.fromWorkspaceId,
      message.toWorkspaceId,
      message.tabId
    );
    const response: MessageResponseMap[typeof action] = { success: moved };
    return response;
  }

  if (action === Action.GetStats) {
    const stats = manager.getStats(message.workspaceId);
    const response: MessageResponseMap[typeof action] = { success: stats !== null, data: stats };
    return response;
  }

  if (action === Action.CheckPageInWorkspaces) {
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
    const response: MessageResponseMap[typeof action] = { success: true, data: matched };
    return response;
  }

  const errorResponse: ErrorResponse = {
    success: false,
    error: 'Unknown action: ' + String(action),
  };
  return errorResponse;
};

// Handle messages from popup and content scripts
browser.runtime.onMessage.addListener(async (message: MessageRequest): Promise<MessageResponse> => {
  if (!manager) {
    await init();
  }

  return handlePopupMessage(message).catch((error) => {
    console.error('[__NAME__] __func__: Error handling message:', error);
    const errorResponse: ErrorResponse = { success: false, error: 'Error handling message.' };
    return errorResponse;
  });
});

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
