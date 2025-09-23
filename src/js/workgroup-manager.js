// Workspaces Data Model and Storage Manager
class WorkGroupManager {
  constructor() {
    this.workGroups = new Map();
    this.currentEditingGroup = null;
    this.init();
  }

  // Initialize the manager and load saved data
  async init() {
    try {
      await this.loadWorkGroups();
      console.log('Workspaces Manager initialized');
    } catch (error) {
      console.error('Failed to initialize Workspaces Manager:', error);
    }
  }

  // Load work groups from browser storage
  async loadWorkGroups() {
    return new Promise((resolve) => {
      browser.storage.local.get(['workGroups'], (result) => {
        if (result.workGroups) {
          // Convert stored array back to Map
          const groups = result.workGroups;
          this.workGroups.clear();
          groups.forEach((group) => {
            this.workGroups.set(group.id, group);
          });
        }
        resolve();
      });
    });
  }

  // Save work groups to browser storage
  async saveWorkGroups() {
    return new Promise((resolve) => {
      // Convert Map to array for storage
      const groupsArray = Array.from(this.workGroups.values());
      browser.storage.local.set({ workGroups: groupsArray }, () => {
        console.log('Work groups saved successfully');
        resolve();
      });
    });
  }

  // Create a new work group
  createWorkGroup(name, color = '#667eea') {
    const id = this.generateId();
    const workGroup = {
      id: id,
      name: name,
      color: color,
      tabs: [],
      pinnedTabs: [],
      createdAt: Date.now(),
      lastOpened: null,
      windowId: null, // Track associated window
    };

    this.workGroups.set(id, workGroup);
    this.saveWorkGroups();
    return workGroup;
  }

  // Update an existing work group
  updateWorkGroup(id, updates) {
    const group = this.workGroups.get(id);
    if (group) {
      Object.assign(group, updates);
      this.saveWorkGroups();
      return group;
    }
    return null;
  }

  // Delete a work group
  deleteWorkGroup(id) {
    const success = this.workGroups.delete(id);
    if (success) {
      this.saveWorkGroups();
    }
    return success;
  }

  // Get a work group by id
  getWorkGroup(id) {
    return this.workGroups.get(id);
  }

  // Get all work groups as array
  getAllWorkGroups() {
    return Array.from(this.workGroups.values());
  }

  // Add tab to work group
  addTabToGroup(groupId, tab, isPinned = false) {
    const group = this.workGroups.get(groupId);
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

      this.saveWorkGroups();
      return true;
    }
    return false;
  }

  // Remove tab from work group
  removeTabFromGroup(groupId, tabId) {
    const group = this.workGroups.get(groupId);
    if (group) {
      group.tabs = group.tabs.filter((tab) => tab.id !== tabId);
      group.pinnedTabs = group.pinnedTabs.filter((tab) => tab.id !== tabId);
      this.saveWorkGroups();
      return true;
    }
    return false;
  }

  // Move tab between work groups
  moveTabBetweenGroups(fromGroupId, toGroupId, tabId) {
    const fromGroup = this.workGroups.get(fromGroupId);
    const toGroup = this.workGroups.get(toGroupId);

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

        this.saveWorkGroups();
        return true;
      }
    }
    return false;
  }

  // Toggle tab pinned status within a group
  toggleTabPin(groupId, tabId) {
    const group = this.workGroups.get(groupId);
    if (group) {
      // Check if tab is in regular tabs
      const tabIndex = group.tabs.findIndex((t) => t.id === tabId);
      if (tabIndex !== -1) {
        // Move to pinned
        const tab = group.tabs.splice(tabIndex, 1)[0];
        group.pinnedTabs.push(tab);
        this.saveWorkGroups();
        return true;
      }

      // Check if tab is in pinned tabs
      const pinnedIndex = group.pinnedTabs.findIndex((t) => t.id === tabId);
      if (pinnedIndex !== -1) {
        // Move to regular
        const tab = group.pinnedTabs.splice(pinnedIndex, 1)[0];
        group.tabs.push(tab);
        this.saveWorkGroups();
        return true;
      }
    }
    return false;
  }

  // Open work group in new window
  async openWorkGroupInWindow(groupId) {
    const group = this.workGroups.get(groupId);
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
        this.saveWorkGroups();
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
      this.saveWorkGroups();

      return window;
    } catch (error) {
      console.error('Failed to open work group in window:', error);
      return null;
    }
  }

  // Update work group tabs from window state
  async updateGroupFromWindow(groupId, windowId) {
    const group = this.workGroups.get(groupId);
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

      this.saveWorkGroups();
      return true;
    } catch (error) {
      console.error('Failed to update group from window:', error);
      return false;
    }
  }

  // Find work group by window ID
  getGroupByWindowId(windowId) {
    for (const group of this.workGroups.values()) {
      if (group.windowId === windowId) {
        return group;
      }
    }
    return null;
  }

  // Generate unique ID
  generateId() {
    return 'wg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Get work group statistics
  getGroupStats(groupId) {
    const group = this.workGroups.get(groupId);
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
    const groups = this.getAllWorkGroups();
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
    const groups = this.getAllWorkGroups();

    // Clear any stale window associations
    groups.forEach((group) => {
      group.windowId = null;
    });

    await this.saveWorkGroups();
    console.log('Cleared stale window associations on startup');
  }

  // Get recently closed work groups
  getRecentlyClosedGroups(limit = 5) {
    return this.getAllWorkGroups()
      .filter((group) => group.lastOpened && !group.windowId)
      .sort((a, b) => b.lastOpened - a.lastOpened)
      .slice(0, limit);
  }

  // Export work groups data
  exportData() {
    return {
      version: '1.0',
      exportDate: Date.now(),
      workGroups: this.getAllWorkGroups(),
    };
  }

  // Import work groups data
  async importData(data) {
    try {
      if (!data.workGroups || !Array.isArray(data.workGroups)) {
        throw new Error('Invalid data format');
      }

      // Clear existing groups (with confirmation in UI)
      this.workGroups.clear();

      // Import groups
      data.workGroups.forEach((group) => {
        // Generate new IDs to avoid conflicts
        const newGroup = {
          ...group,
          id: this.generateId(),
          windowId: null, // Reset window associations
          lastOpened: null,
        };
        this.workGroups.set(newGroup.id, newGroup);
      });

      await this.saveWorkGroups();
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorkGroupManager;
}
