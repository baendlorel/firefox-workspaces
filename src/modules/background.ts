// Background script for Workspaces extension
let workspacesManager;

// Initialize when extension starts
browser.runtime.onStartup.addListener(async () => {
  await initializeWorkspacesManager();
});

browser.runtime.onInstalled.addListener(async () => {
  await initializeWorkspacesManager();
});

async function initializeWorkspacesManager() {
  // WorkspacesManager is already loaded via manifest scripts
  try {
    workspacesManager = new WorkspacesManager();

    // Restore sessions on startup
    await workspacesManager.restoreGroupSessions();

    console.log('Workspaces Manager initialized in background');
  } catch (error) {
    console.error('__NAME__: Failed to initialize Workspaces Manager:', error);
  }
}

// Handle window events for session management
browser.windows.onRemoved.addListener(async (windowId) => {
  if (!workspacesManager) return;

  // Check if this window belongs to a work group
  const group = workspacesManager.getGroupByWindowId(windowId);
  if (group) {
    console.log(`Work group window closed: ${group.name}`);

    // The tabs were already saved during the session, just clear window association
    group.windowId = null;
    await workspacesManager.saveWorkspacess();

    console.log(`Saved work group session for: ${group.name}`);
  }
});

// Track window focus changes to update group states
browser.windows.onFocusChanged.addListener(async (windowId) => {
  if (!workspacesManager || windowId === browser.windows.WINDOW_ID_NONE) return;

  const group = workspacesManager.getGroupByWindowId(windowId);
  if (group) {
    // Update group's last accessed time
    group.lastAccessed = Date.now();
    await workspacesManager.saveWorkspacess();
  }
});

// Periodically save work group states for active windows
setInterval(async () => {
  if (!workspacesManager) return;

  const groups = workspacesManager.getAllWorkspacess();
  const activeGroups = groups.filter((g) => g.windowId);

  for (const group of activeGroups) {
    try {
      // Verify window still exists
      const windows = await browser.windows.getAll();
      const windowExists = windows.some((w) => w.id === group.windowId);

      if (windowExists) {
        await workspacesManager.updateGroupFromWindow(group.id, group.windowId);
      } else {
        // Window was closed but event wasn't caught
        group.windowId = null;
        await workspacesManager.saveWorkspacess();
      }
    } catch (error) {
      console.error('__NAME__: Error during periodic save:', error);
    }
  }
}, 30000); // Save every 30 seconds

// Save sessions before browser shuts down
browser.runtime.onSuspend.addListener(async () => {
  if (workspacesManager) {
    console.log('Saving work group sessions before browser shutdown');
    await workspacesManager.saveActiveGroupSessions();
  }
});

// Handle browser startup
browser.runtime.onStartup.addListener(async () => {
  await initializeWorkspacesManager();
});

// Save work group sessions periodically and on important events
browser.tabs.onAttached.addListener(async (tabId, attachInfo) => {
  if (!workspacesManager) return;

  const group = workspacesManager.getGroupByWindowId(attachInfo.newWindowId);
  if (group) {
    // Tab was moved to a work group window
    setTimeout(() => {
      workspacesManager.updateGroupFromWindow(group.id, attachInfo.newWindowId);
    }, 1000);
  }
});

browser.tabs.onDetached.addListener(async (tabId, detachInfo) => {
  if (!workspacesManager) return;

  const group = workspacesManager.getGroupByWindowId(detachInfo.oldWindowId);
  if (group) {
    // Tab was moved from a work group window
    setTimeout(() => {
      workspacesManager.updateGroupFromWindow(group.id, detachInfo.oldWindowId);
    }, 1000);
  }
});

// Handle tab events
browser.tabs.onCreated.addListener(async (tab) => {
  if (!workspacesManager) return;

  // Check if tab was created in a work group window
  const group = workspacesManager.getGroupByWindowId(tab.windowId);
  if (group) {
    console.log(`New tab created in work group: ${group.name}`);
    // The tab will be saved when the window is closed or manually updated
  }
});

browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  if (!workspacesManager) return;

  // Update work groups if tab was removed from a work group window
  const group = workspacesManager.getGroupByWindowId(removeInfo.windowId);
  if (group && !removeInfo.isWindowClosing) {
    // Update group state immediately when individual tab is closed
    await workspacesManager.updateGroupFromWindow(group.id, removeInfo.windowId);
  }
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!workspacesManager) return;

  // Update work group if tab URL or title changed in a work group window
  if (changeInfo.url || changeInfo.title) {
    const group = workspacesManager.getGroupByWindowId(tab.windowId);
    if (group) {
      // Update the specific tab in the group
      const updateTab = (tabArray) => {
        const index = tabArray.findIndex((t) => t.id === tabId);
        if (index !== -1) {
          tabArray[index] = {
            ...tabArray[index],
            url: tab.url,
            title: tab.title,
            favIconUrl: tab.favIconUrl,
          };
          return true;
        }
        return false;
      };

      const updated = updateTab(group.tabs) || updateTab(group.pinnedTabs);
      if (updated) {
        await workspacesManager.saveWorkspacess();
      }
    }
  }
});

// Handle messages from popup and content scripts
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (!workspacesManager) {
    await initializeWorkspacesManager();
  }

  try {
    switch (message.action) {
      case 'getWorkspacess':
        sendResponse({
          success: true,
          data: workspacesManager.getAllWorkspacess(),
        });
        break;

      case 'createWorkspaces':
        const newGroup = workspacesManager.createWorkspaces(message.name, message.color);
        sendResponse({
          success: true,
          data: newGroup,
        });
        break;

      case 'updateWorkspaces':
        const updatedGroup = workspacesManager.updateWorkspaces(message.id, message.updates);
        sendResponse({
          success: !!updatedGroup,
          data: updatedGroup,
        });
        break;

      case 'deleteWorkspaces':
        const deleted = workspacesManager.deleteWorkspaces(message.id);
        sendResponse({
          success: deleted,
        });
        break;

      case 'addCurrentTab':
        const currentTab = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (currentTab[0]) {
          const added = workspacesManager.addTabToGroup(
            message.workspaceId,
            currentTab[0],
            message.isPinned
          );
          sendResponse({
            success: added,
          });
        } else {
          sendResponse({
            success: false,
            error: 'No active tab found',
          });
        }
        break;

      case 'removeTab':
        const removed = workspacesManager.removeTabFromGroup(message.workspaceId, message.tabId);
        sendResponse({
          success: removed,
        });
        break;

      case 'togglePin':
        const pinToggled = workspacesManager.toggleTabPin(message.workspaceId, message.tabId);
        sendResponse({
          success: pinToggled,
        });
        break;

      case 'openWorkspaces':
        const window = await workspacesManager.openWorkspacesInWindow(message.workspaceId);
        sendResponse({
          success: !!window,
          data: window,
        });
        break;

      case 'moveTab':
        const moved = workspacesManager.moveTabBetweenGroups(
          message.fromGroupId,
          message.toGroupId,
          message.tabId
        );
        sendResponse({
          success: moved,
        });
        break;

      case 'getGroupStats':
        const stats = workspacesManager.getGroupStats(message.workspaceId);
        sendResponse({
          success: !!stats,
          data: stats,
        });
        break;

      case 'checkPageInGroups':
        const groups = workspacesManager.getAllWorkspacess();
        const matchingGroups = groups.filter((group) => {
          const allTabs = [...(group.tabs || []), ...(group.pinnedTabs || [])];
          return allTabs.some((tab) => tab.url === message.url);
        });
        sendResponse({
          success: true,
          groups: matchingGroups,
        });
        break;

      default:
        sendResponse({
          success: false,
          error: 'Unknown action',
        });
    }
  } catch (error) {
    console.error('__NAME__: Error handling message:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }

  return true; // Keep message channel open for async response
});

// Context menu setup
browser.runtime.onInstalled.addListener(() => {
  // Create context menu item for adding current tab to work group
  browser.contextMenus.create({
    id: 'addToWorkspaces',
    title: 'Add to Workspaces',
    contexts: ['page'],
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'addToWorkspaces') {
    // Open popup to select work group
    // This could be enhanced with a submenu showing available groups
    browser.browserAction.openPopup();
  }
});

// Initialize immediately
initializeWorkspacesManager();
