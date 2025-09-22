// Background script for Work Group extension
let workGroupManager;

// Initialize when extension starts
browser.runtime.onStartup.addListener(async () => {
  await initializeWorkGroupManager();
});

browser.runtime.onInstalled.addListener(async () => {
  await initializeWorkGroupManager();
});

async function initializeWorkGroupManager() {
  // WorkGroupManager is already loaded via manifest scripts
  try {
    workGroupManager = new WorkGroupManager();

    // Restore sessions on startup
    await workGroupManager.restoreGroupSessions();

    console.log('Work Group Manager initialized in background');
  } catch (error) {
    console.error('Failed to initialize Work Group Manager:', error);
  }
}

// Handle window events for session management
browser.windows.onRemoved.addListener(async (windowId) => {
  if (!workGroupManager) return;

  // Check if this window belongs to a work group
  const group = workGroupManager.getGroupByWindowId(windowId);
  if (group) {
    console.log(`Work group window closed: ${group.name}`);

    // The tabs were already saved during the session, just clear window association
    group.windowId = null;
    await workGroupManager.saveWorkGroups();

    console.log(`Saved work group session for: ${group.name}`);
  }
});

// Track window focus changes to update group states
browser.windows.onFocusChanged.addListener(async (windowId) => {
  if (!workGroupManager || windowId === browser.windows.WINDOW_ID_NONE) return;

  const group = workGroupManager.getGroupByWindowId(windowId);
  if (group) {
    // Update group's last accessed time
    group.lastAccessed = Date.now();
    await workGroupManager.saveWorkGroups();
  }
});

// Periodically save work group states for active windows
setInterval(async () => {
  if (!workGroupManager) return;

  const groups = workGroupManager.getAllWorkGroups();
  const activeGroups = groups.filter((g) => g.windowId);

  for (const group of activeGroups) {
    try {
      // Verify window still exists
      const windows = await browser.windows.getAll();
      const windowExists = windows.some((w) => w.id === group.windowId);

      if (windowExists) {
        await workGroupManager.updateGroupFromWindow(group.id, group.windowId);
      } else {
        // Window was closed but event wasn't caught
        group.windowId = null;
        await workGroupManager.saveWorkGroups();
      }
    } catch (error) {
      console.error('Error during periodic save:', error);
    }
  }
}, 30000); // Save every 30 seconds

// Save sessions before browser shuts down
browser.runtime.onSuspend.addListener(async () => {
  if (workGroupManager) {
    console.log('Saving work group sessions before browser shutdown');
    await workGroupManager.saveActiveGroupSessions();
  }
});

// Handle browser startup
browser.runtime.onStartup.addListener(async () => {
  await initializeWorkGroupManager();
});

// Save work group sessions periodically and on important events
browser.tabs.onAttached.addListener(async (tabId, attachInfo) => {
  if (!workGroupManager) return;

  const group = workGroupManager.getGroupByWindowId(attachInfo.newWindowId);
  if (group) {
    // Tab was moved to a work group window
    setTimeout(() => {
      workGroupManager.updateGroupFromWindow(group.id, attachInfo.newWindowId);
    }, 1000);
  }
});

browser.tabs.onDetached.addListener(async (tabId, detachInfo) => {
  if (!workGroupManager) return;

  const group = workGroupManager.getGroupByWindowId(detachInfo.oldWindowId);
  if (group) {
    // Tab was moved from a work group window
    setTimeout(() => {
      workGroupManager.updateGroupFromWindow(group.id, detachInfo.oldWindowId);
    }, 1000);
  }
});

// Handle tab events
browser.tabs.onCreated.addListener(async (tab) => {
  if (!workGroupManager) return;

  // Check if tab was created in a work group window
  const group = workGroupManager.getGroupByWindowId(tab.windowId);
  if (group) {
    console.log(`New tab created in work group: ${group.name}`);
    // The tab will be saved when the window is closed or manually updated
  }
});

browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  if (!workGroupManager) return;

  // Update work groups if tab was removed from a work group window
  const group = workGroupManager.getGroupByWindowId(removeInfo.windowId);
  if (group && !removeInfo.isWindowClosing) {
    // Update group state immediately when individual tab is closed
    await workGroupManager.updateGroupFromWindow(group.id, removeInfo.windowId);
  }
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!workGroupManager) return;

  // Update work group if tab URL or title changed in a work group window
  if (changeInfo.url || changeInfo.title) {
    const group = workGroupManager.getGroupByWindowId(tab.windowId);
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
        await workGroupManager.saveWorkGroups();
      }
    }
  }
});

// Handle messages from popup and content scripts
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (!workGroupManager) {
    await initializeWorkGroupManager();
  }

  try {
    switch (message.action) {
      case 'getWorkGroups':
        sendResponse({
          success: true,
          data: workGroupManager.getAllWorkGroups(),
        });
        break;

      case 'createWorkGroup':
        const newGroup = workGroupManager.createWorkGroup(message.name, message.color);
        sendResponse({
          success: true,
          data: newGroup,
        });
        break;

      case 'updateWorkGroup':
        const updatedGroup = workGroupManager.updateWorkGroup(message.id, message.updates);
        sendResponse({
          success: !!updatedGroup,
          data: updatedGroup,
        });
        break;

      case 'deleteWorkGroup':
        const deleted = workGroupManager.deleteWorkGroup(message.id);
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
          const added = workGroupManager.addTabToGroup(
            message.groupId,
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
        const removed = workGroupManager.removeTabFromGroup(message.groupId, message.tabId);
        sendResponse({
          success: removed,
        });
        break;

      case 'togglePin':
        const pinToggled = workGroupManager.toggleTabPin(message.groupId, message.tabId);
        sendResponse({
          success: pinToggled,
        });
        break;

      case 'openWorkGroup':
        const window = await workGroupManager.openWorkGroupInWindow(message.groupId);
        sendResponse({
          success: !!window,
          data: window,
        });
        break;

      case 'moveTab':
        const moved = workGroupManager.moveTabBetweenGroups(
          message.fromGroupId,
          message.toGroupId,
          message.tabId
        );
        sendResponse({
          success: moved,
        });
        break;

      case 'getGroupStats':
        const stats = workGroupManager.getGroupStats(message.groupId);
        sendResponse({
          success: !!stats,
          data: stats,
        });
        break;

      case 'checkPageInGroups':
        const groups = workGroupManager.getAllWorkGroups();
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
    console.error('Error handling message:', error);
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
    id: 'addToWorkGroup',
    title: 'Add to Work Group',
    contexts: ['page'],
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'addToWorkGroup') {
    // Open popup to select work group
    // This could be enhanced with a submenu showing available groups
    browser.browserAction.openPopup();
  }
});

// Initialize immediately
initializeWorkGroupManager();
