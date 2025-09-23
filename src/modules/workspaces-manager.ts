import { Consts } from './consts.js';
import { $ArrayFrom, $genId } from './lib.js';

// Workspaces Data Model and Storage Manager
class WorkspacesManager {
  private readonly map: Map<string, WorkspaceEntry>;
  private readonly currentEditingGroup: null = null;

  constructor() {
    this.map = new Map();
    this.currentEditingGroup = null;
    this.init();
  }

  // Initialize the manager and load saved data
  async init() {
    try {
      await this.loadWorkspacess();
      console.log('Workspaces Manager initialized');
    } catch (error) {
      console.error('Failed to initialize Workspaces Manager:', error);
    }
  }

  // Load work groups from browser storage
  async loadWorkspacess() {
    const workspaces = (await browser.storage.local.get(Consts.StorageKey)) as WorkspaceStoredData;
    if (!workspaces.list) {
      return;
    }
    this.map.clear();
    const list = workspaces.list;
    const len = workspaces.list.length;
    for (let i = 0; i < len; i++) {
      this.map.set(list[i].id, list[i].data);
    }
  }

  async saveWorkspacess() {
    const list = $ArrayFrom(this.map.values());
    const data: WorkspaceStoredData = { list };
    await browser.storage.local.set(data);
  }

  // todo 由于火狐浏览器的操作是异步的，因此这里需要在前端调用的时候加入防抖或延迟
  create(name: string, color: HexColor = '#667eea') {
    const id = $genId();
    const workspace: WorkspaceEntry = {
      id: id,
      name: name,
      color: color,
      tabs: [],
      pinnedTabs: [],
      createdAt: Date.now(),
      lastOpened: null,
      windowId: null, // Track associated window
    };

    this.map.set(id, workspace);
    this.saveWorkspacess();
    return workspace;
  }

  // Update an existing work group
  updateWorkspaces(id, updates) {
    const group = this.map.get(id);
    if (group) {
      Object.assign(group, updates);
      this.saveWorkspacess();
      return group;
    }
    return null;
  }

  // Delete a work group
  deleteWorkspaces(id) {
    const success = this.map.delete(id);
    if (success) {
      this.saveWorkspacess();
    }
    return success;
  }

  // Get a work group by id
  getWorkspaces(id) {
    return this.map.get(id);
  }

  // Get all work groups as array
  getAllWorkspacess() {
    return Array.from(this.map.values());
  }

  // Add tab to work group
  addTabToGroup(groupId, tab, isPinned = false) {
    const group = this.map.get(groupId);
    if (group) {
      const tabData = {
        id: tab.id,
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl,
        addedAt: Date.now(),
      };

      if (isPinned) {
        // Remove from regular tabs if exists
        group.tabs = group.tabs.filter((t) => t.id !== tab.id);
        // Add to pinned tabs if not already there
        if (!group.pinnedTabs.find((t) => t.id === tab.id)) {
          group.pinnedTabs.push(tabData);
        }
      } else {
        // Remove from pinned tabs if exists
        group.pinnedTabs = group.pinnedTabs.filter((t) => t.id !== tab.id);
        // Add to regular tabs if not already there
        if (!group.tabs.find((t) => t.id === tab.id)) {
          group.tabs.push(tabData);
        }
      }

      this.saveWorkspacess();
      return true;
    }
    return false;
  }

  // Remove tab from work group
  removeTabFromGroup(groupId, tabId) {
    const group = this.map.get(groupId);
    if (group) {
      group.tabs = group.tabs.filter((tab) => tab.id !== tabId);
      group.pinnedTabs = group.pinnedTabs.filter((tab) => tab.id !== tabId);
      this.saveWorkspacess();
      return true;
    }
    return false;
  }

  // Move tab between work groups
  moveTabBetweenGroups(fromGroupId, toGroupId, tabId) {
    const fromGroup = this.map.get(fromGroupId);
    const toGroup = this.map.get(toGroupId);

    if (fromGroup && toGroup) {
      // Find tab in source group
      let tab = fromGroup.tabs.find((t) => t.id === tabId);
      let isPinned = false;

      if (!tab) {
        tab = fromGroup.pinnedTabs.find((t) => t.id === tabId);
        isPinned = true;
      }

      if (tab) {
        // Remove from source group
        this.removeTabFromGroup(fromGroupId, tabId);

        // Add to destination group with same pinned status
        if (isPinned) {
          toGroup.pinnedTabs.push(tab);
        } else {
          toGroup.tabs.push(tab);
        }

        this.saveWorkspacess();
        return true;
      }
    }
    return false;
  }

  // Toggle tab pinned status within a group
  toggleTabPin(groupId, tabId) {
    const group = this.map.get(groupId);
    if (group) {
      // Check if tab is in regular tabs
      const tabIndex = group.tabs.findIndex((t) => t.id === tabId);
      if (tabIndex !== -1) {
        // Move to pinned
        const tab = group.tabs.splice(tabIndex, 1)[0];
        group.pinnedTabs.push(tab);
        this.saveWorkspacess();
        return true;
      }

      // Check if tab is in pinned tabs
      const pinnedIndex = group.pinnedTabs.findIndex((t) => t.id === tabId);
      if (pinnedIndex !== -1) {
        // Move to regular
        const tab = group.pinnedTabs.splice(pinnedIndex, 1)[0];
        group.tabs.push(tab);
        this.saveWorkspacess();
        return true;
      }
    }
    return false;
  }

  // Open work group in new window
  async openWorkspacesInWindow(groupId) {
    const group = this.map.get(groupId);
    if (!group) return null;

    try {
      // If group already has an active window, focus it
      if (group.windowId) {
        try {
          await browser.windows.update(group.windowId, { focused: true });
          return { id: group.windowId };
        } catch (error) {
          // Window doesn't exist anymore, clear the reference
          group.windowId = null;
        }
      }

      // Collect all URLs (pinned first, then regular)
      const pinnedUrls = group.pinnedTabs.map((tab) => tab.url).filter((url) => url);
      const regularUrls = group.tabs.map((tab) => tab.url).filter((url) => url);
      const allUrls = [...pinnedUrls, ...regularUrls];

      if (allUrls.length === 0) {
        // Create window with new tab page if no URLs
        const window = await browser.windows.create({
          url: 'about:newtab',
          type: 'normal',
        });
        group.windowId = window.id;
        group.lastOpened = Date.now();
        this.saveWorkspacess();
        return window;
      }

      // Create new window with first URL
      const window = await browser.windows.create({
        url: allUrls[0],
        type: 'normal',
      });

      // Wait a moment for window to be ready
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Open remaining URLs as tabs
      const createdTabs = [];
      for (let i = 1; i < allUrls.length; i++) {
        try {
          const tab = await browser.tabs.create({
            windowId: window.id,
            url: allUrls[i],
            active: false,
          });
          createdTabs.push({ tab, isPinned: i <= pinnedUrls.length });
        } catch (error) {
          console.error(`Failed to create tab for URL: ${allUrls[i]}`, error);
        }
      }

      // Pin tabs that should be pinned
      for (const { tab, isPinned } of createdTabs) {
        if (isPinned) {
          try {
            await browser.tabs.update(tab.id, { pinned: true });
          } catch (error) {
            console.error('Failed to pin tab:', error);
          }
        }
      }

      // Pin the first tab if it should be pinned
      if (pinnedUrls.length > 0) {
        try {
          const tabs = await browser.tabs.query({ windowId: window.id });
          if (tabs.length > 0) {
            await browser.tabs.update(tabs[0].id, { pinned: true });
          }
        } catch (error) {
          console.error('Failed to pin first tab:', error);
        }
      }

      // Update group with window association and last opened time
      group.windowId = window.id;
      group.lastOpened = Date.now();
      this.saveWorkspacess();

      return window;
    } catch (error) {
      console.error('Failed to open work group in window:', error);
      return null;
    }
  }

  // Update work group tabs from window state
  async updateGroupFromWindow(groupId, windowId) {
    const group = this.map.get(groupId);
    if (!group || group.windowId !== windowId) return false;

    try {
      const tabs = await browser.tabs.query({ windowId: windowId });

      // Clear existing tabs
      group.tabs = [];
      group.pinnedTabs = [];

      // Categorize tabs
      tabs.forEach((tab) => {
        const tabData = {
          id: tab.id,
          url: tab.url,
          title: tab.title,
          favIconUrl: tab.favIconUrl,
          addedAt: Date.now(),
        };

        if (tab.pinned) {
          group.pinnedTabs.push(tabData);
        } else {
          group.tabs.push(tabData);
        }
      });

      this.saveWorkspacess();
      return true;
    } catch (error) {
      console.error('Failed to update group from window:', error);
      return false;
    }
  }

  // Find work group by window ID
  getGroupByWindowId(windowId) {
    for (const group of this.map.values()) {
      if (group.windowId === windowId) {
        return group;
      }
    }
    return null;
  }

  // Get work group statistics
  getGroupStats(groupId) {
    const group = this.map.get(groupId);
    if (!group) return null;

    return {
      totalTabs: group.tabs.length + group.pinnedTabs.length,
      pinnedTabs: group.pinnedTabs.length,
      regularTabs: group.tabs.length,
      lastOpened: group.lastOpened,
      createdAt: group.createdAt,
      isActive: !!group.windowId,
    };
  }

  // Save current session for all active work groups
  async saveActiveGroupSessions() {
    const groups = this.getAllWorkspacess();
    const activeGroups = groups.filter((g) => g.windowId);

    for (const group of activeGroups) {
      try {
        await this.updateGroupFromWindow(group.id, group.windowId);
      } catch (error) {
        console.error(`Failed to save session for group ${group.name}:`, error);
      }
    }
  }

  // Restore all work group sessions on startup
  async restoreGroupSessions() {
    const groups = this.getAllWorkspacess();

    // Clear any stale window associations
    groups.forEach((group) => {
      group.windowId = null;
    });

    await this.saveWorkspacess();
    console.log('Cleared stale window associations on startup');
  }

  // Get recently closed work groups
  getRecentlyClosedGroups(limit = 5) {
    return this.getAllWorkspacess()
      .filter((group) => group.lastOpened && !group.windowId)
      .sort((a, b) => b.lastOpened - a.lastOpened)
      .slice(0, limit);
  }

  // Export work groups data
  exportData() {
    return {
      version: '1.0',
      exportDate: Date.now(),
      workspaceses: this.getAllWorkspacess(),
    };
  }

  // Import work groups data
  async importData(data) {
    try {
      if (!data.workspaceses || !Array.isArray(data.workspaceses)) {
        throw new Error('Invalid data format');
      }

      // Clear existing groups (with confirmation in UI)
      this.map.clear();

      // Import groups
      data.workspaceses.forEach((group) => {
        // Generate new IDs to avoid conflicts
        const newGroup = {
          ...group,
          id: this.generateId(),
          windowId: null, // Reset window associations
          lastOpened: null,
        };
        this.map.set(newGroup.id, newGroup);
      });

      await this.saveWorkspacess();
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorkspacesManager;
}
