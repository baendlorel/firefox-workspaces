import { Consts } from './consts.js';
import { $ArrayFilter, $ArrayFind, $ArrayFrom, $ArrayPush, $assign, $genId, $now } from './lib.js';

// Workspace Data Model and Storage Manager
class WorkspaceManager {
  private readonly _map: Map<string, Workspace>;
  private readonly currentEditingGroup: null = null;

  constructor() {
    this._map = new Map();
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
    this._map.clear();
    const list = workspaces.list;
    const len = workspaces.list.length;
    for (let i = 0; i < len; i++) {
      this._map.set(list[i].id, list[i]);
    }
  }

  async save() {
    const list = $ArrayFrom(this._map.values());
    const data: WorkspaceStoredData = { list };
    try {
      await browser.storage.local.set(data);
    } catch (error) {
      console.error('Failed to save workspaces:', error);
      return false;
    }
    return true;
  }

  // todo 由于火狐浏览器的操作是异步的，因此这里需要在前端调用的时候加入防抖或延迟
  // 要不然全都改成异步函数吧
  create(name: string, color: HexColor = '#667eea') {
    const id = $genId();
    const workspace: Workspace = {
      id: id,
      name: name,
      color: color,
      tabs: [],
      pinnedTabs: [],
      createdAt: Date.now(),
      lastOpened: null,
      windowId: null, // Track associated window
    };

    this._map.set(id, workspace);
    this.save();
    return workspace;
  }

  update(id: string, updates: Partial<Workspace>) {
    const group = this._map.get(id);
    if (!group) {
      return null;
    }
    $assign(group, updates);
    this.save();
    return group;
  }

  // Delete a work group
  delete(id: string) {
    const success = this._map.delete(id);
    if (success) {
      this.save();
    }
    return success;
  }

  // Get a work group by id
  get(id: string) {
    return this._map.get(id);
  }

  // Get all work groups as array
  getAllWorkspacess() {
    return $ArrayFrom(this._map.values());
  }

  // Add tab to work group
  // todo 找不到不用报错的？？
  addTabToGroup(id: string, tab: Tab, pinned: boolean = false) {
    const workspace = this._map.get(id);
    if (!workspace) {
      return false;
    }

    const tabData: Tab = {
      id: tab.id,
      url: tab.url,
      title: tab.title,
      favIconUrl: tab.favIconUrl,
      addedAt: $now(),
    };

    const except = (t: Tab) => t.id !== tab.id;
    const find = (t: Tab) => t.id === tab.id;

    if (pinned) {
      // Remove from regular tabs if exists
      workspace.tabs = $ArrayFilter.call(workspace.tabs, except);

      // Add to pinned tabs if not already there
      if (!$ArrayFind.call(workspace.pinnedTabs, find)) {
        $ArrayPush.call(workspace.pinnedTabs, tabData);
      }
    } else {
      // Remove from pinned tabs if exists
      workspace.pinnedTabs = $ArrayFilter.call(workspace.pinnedTabs, except);
      // Add to regular tabs if not already there
      if (!$ArrayFind.call(workspace.tabs, find)) {
        $ArrayPush.call(workspace.tabs, tabData);
      }
    }

    this.save();
    return true;
  }

  removeTab(id: string, tabId: number) {
    const workspace = this._map.get(id);
    if (!workspace) {
      return false;
    }
    const filter = (tab: Tab) => tab.id !== tabId;
    workspace.tabs = $ArrayFilter.call(workspace.tabs, filter);
    workspace.pinnedTabs = $ArrayFilter.call(workspace.pinnedTabs, filter);
    this.save();
    return true;
  }

  // fixme 从这里往下暂时先不用缓存的方法来写，最后让ai来做
  // Move tab between work groups
  moveTabBetweenGroups(fromId: string, toId: string, tabId: number) {
    const from = this._map.get(fromId);
    const to = this._map.get(toId);

    if (from && to) {
      // Find tab in source group
      let tab = from.tabs.find((t) => t.id === tabId);
      let isPinned = false;

      if (!tab) {
        tab = from.pinnedTabs.find((t) => t.id === tabId);
        isPinned = true;
      } else {
        // Remove from source group
        this.removeTab(fromId, tabId);

        // Add to destination group with same pinned status
        if (isPinned) {
          to.pinnedTabs.push(tab);
        } else {
          to.tabs.push(tab);
        }

        this.save();
        return true;
      }
    }
    return false;
  }

  // Toggle tab pinned status within a group
  toggleTabPin(id: string, tabId: number) {
    const workspace = this._map.get(id);
    if (!workspace) {
      return false;
    }

    // Check if tab is in regular tabs
    const tabIndex = workspace.tabs.findIndex((t) => t.id === tabId);
    if (tabIndex !== -1) {
      // Move to pinned
      const tab = workspace.tabs.splice(tabIndex, 1)[0];
      workspace.pinnedTabs.push(tab);
      this.save();
      return true;
    }

    // Check if tab is in pinned tabs
    const pinnedIndex = workspace.pinnedTabs.findIndex((t) => t.id === tabId);
    if (pinnedIndex !== -1) {
      // Move to regular
      const tab = workspace.pinnedTabs.splice(pinnedIndex, 1)[0];
      workspace.tabs.push(tab);
      this.save();
      return true;
    }
  }

  // Open work group in new window
  async openWorkspacesInWindow(id: string) {
    const group = this._map.get(id);
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
        this.save();
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
      this.save();

      return window;
    } catch (error) {
      console.error('Failed to open work group in window:', error);
      return null;
    }
  }

  // Update work group tabs from window state
  async updateGroupFromWindow(groupId, windowId) {
    const group = this._map.get(groupId);
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

      this.save();
      return true;
    } catch (error) {
      console.error('Failed to update group from window:', error);
      return false;
    }
  }

  // Find work group by window ID
  getGroupByWindowId(windowId) {
    for (const group of this._map.values()) {
      if (group.windowId === windowId) {
        return group;
      }
    }
    return null;
  }

  // Get work group statistics
  getGroupStats(groupId) {
    const group = this._map.get(groupId);
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

    await this.save();
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
      this._map.clear();

      // Import groups
      data.workspaceses.forEach((group) => {
        // Generate new IDs to avoid conflicts
        const newGroup = {
          ...group,
          id: this.generateId(),
          windowId: null, // Reset window associations
          lastOpened: null,
        };
        this._map.set(newGroup.id, newGroup);
      });

      await this.save();
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorkspaceManager;
}
