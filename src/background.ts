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
    manager = new WorkspaceManager();

    // Restore sessions on startup
    await manager.restoreSessions();

    console.log('Workspaces Manager initialized in background');
  } catch (error) {
    console.error('__NAME__: Failed to initialize Workspaces Manager:', error);
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
    console.log(`workspace window closed: ${workspace.name}`);

    // The tabs were already saved during the session, just clear window association
    workspace.windowId = undefined;
    await manager.save();

    console.log(`Saved workspace session for: ${workspace.name}`);
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

// Periodically save workspace states for active windows
setInterval(async () => {
  if (!manager) return;

  const workspaces = manager.getWorkspaces();
  const activated = workspaces.filter((g) => g.windowId);

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
        await manager.save();
      }
    } catch (error) {
      console.error('__NAME__: Error during periodic save:', error);
    }
  }

  for (const workspace of activated) {
  }
}, 30000); // Save every 30 seconds

// Save sessions before browser shuts down
browser.runtime.onSuspend.addListener(async () => {
  if (manager) {
    console.log('Saving workspace sessions before browser shutdown');
    await manager.saveActiveSessions();
  }
});

// Handle browser startup
browser.runtime.onStartup.addListener(async () => {
  await init();
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
    alert('__NAME__: Tab created without windowId. ' + JSON.stringify(tab));
    return;
  }

  // Check if tab was created in a workspace window
  const workspace = manager.getByWindowId(tab.windowId);
  if (workspace) {
    console.log(`New tab created in workspace: ${workspace.name}`);
    // The tab will be saved when the window is closed or manually updated
  }
});

browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
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
    alert('__NAME__: Tab created without windowId. ' + JSON.stringify(browserTab));
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
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (!manager) {
    await init();
  }

  try {
    switch (message.action) {
      case Action.GetWorkspaces:
        sendResponse({
          success: true,
          data: manager.workspaces,
        });
        break;

      case 'createWorkspaces':
        const w = manager.create(message.name, message.color);
        sendResponse({ success: true, data: w });
        break;

      case 'updateWorkspaces':
        const updated = manager.update(message.id, message.updates);
        sendResponse({ success: updated !== null, data: updated });
        break;

      case 'deleteWorkspaces':
        const deleted = manager.delete(message.id);
        sendResponse({ success: deleted });
        break;

      case 'addCurrentTab':
        const currentTab = await browser.tabs.query({ active: true, currentWindow: true });

        if (currentTab[0]) {
          const added = manager.addTab(message.workspaceId, currentTab[0], message.isPinned);
          sendResponse({ success: added });
        } else {
          sendResponse({ success: false, error: 'No active tab found' });
        }
        break;

      case 'removeTab':
        const removed = manager.removeTab(message.workspaceId, message.tabId);
        sendResponse({ success: removed });
        break;

      case 'togglePin':
        const pinToggled = manager.toggleTabPin(message.workspaceId, message.tabId);
        sendResponse({ success: pinToggled });
        break;

      case 'openWorkspaces':
        const window = await manager.open(message.workspaceId);
        sendResponse({ success: window !== null, data: window });
        break;

      case 'moveTab':
        const moved = manager.moveTabBetweenWorkspaces(
          message.fromWorkspaceId,
          message.toWorkspaceId,
          message.tabId
        );
        sendResponse({ success: moved });
        break;

      case 'getGroupStats':
        const stats = manager.getStats(message.workspaceId);
        sendResponse({ success: stats !== null, data: stats });
        break;

      case 'checkPageInGroups':
        const matchingGroups = manager.workspaces.filter((workspace) => {
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
        sendResponse({ success: true, groups: matchingGroups });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('__NAME__: Error handling message:', error);
    sendResponse({ success: false });
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

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'addToWorkspaces') {
    // Open popup to select workspace
    // This could be enhanced with a submenu showing available groups
    browser.browserAction.openPopup();
  }
});

// Initialize immediately
init();
