import { Consts } from './lib/consts.js';
import { $assign, $now, $ArrayFilter, $ArrayFind, $ArrayPush, $isArray } from './lib/native.js';
import { $genId, $sleep } from './lib/utils.js';

// Workspace Data Model and Storage Manager
class WorkspaceManager {
  private readonly _map = new Map<string, IndexedWorkspace>();
  private readonly _arr: IndexedWorkspace[] = [];

  constructor() {
    this.init();
  }

  // Initialize the manager and load saved data
  async init() {
    try {
      await this.loadWorkspacess();
      console.log('Workspaces Manager initialized');
    } catch (error) {
      console.error('__NAME__: Failed to initialize Workspaces Manager:', error);
    }
  }

  // Load work groups from browser storage
  async loadWorkspacess() {
    const workspaces = (await browser.storage.local.get(Consts.StorageKey)) as WorkspaceStoredData;
    if (!workspaces.list) {
      return;
    }

    const list = workspaces.list;
    const len = workspaces.list.length;

    // prepare the containers
    this._map.clear();
    this._arr.length = len;

    // initialize 2 containers
    for (let i = 0; i < len; i++) {
      const indexed = $assign({ index: i }, list[i]);
      this._map.set(list[i].id, $assign(indexed));
      this._arr[i] = indexed;
    }
  }

  async save() {
    const data: WorkspaceStoredData = { list: this._arr };
    try {
      await browser.storage.local.set(data);
    } catch (error) {
      console.error('__NAME__: Failed to save workspaces:', error);
      return false;
    }
    return true;
  }

  // todo 由于火狐浏览器的操作是异步的，因此这里需要在前端调用的时候加入防抖或延迟
  // 要不然全都改成异步函数吧
  create(name: string, color: HexColor = '#667eea'): IndexedWorkspace {
    const id = $genId();
    const workspace: IndexedWorkspace = {
      index: this._arr.length,
      id: id,
      name: name,
      color: color,
      tabs: [],
      pinnedTabs: [],
      createdAt: Date.now(),
      lastOpened: NaN,
      windowId: undefined, // Track associated window
    };

    this._map.set(id, workspace);
    this._arr.push(workspace);

    this.save();
    return workspace;
  }

  update(id: string, updates: Partial<Workspace>) {
    const workspace = this._map.get(id);
    if (!workspace) {
      return null;
    }
    $assign(workspace, updates);
    this.save();
    return workspace;
  }

  // Delete a work group
  delete(id: string): boolean {
    const target = this._map.get(id);
    if (!target) {
      return false;
    }

    this._map.delete(id);
    this._arr.splice(target.index, 1);
    for (let i = target.index; i < this._arr.length; i++) {
      this._arr[i].index = i;
    }

    this.save();
    return true;
  }

  get(id: string) {
    return this._map.get(id);
  }

  // Add tab to work group
  addTab(id: string, tab: TabInfo, pinned: boolean = false) {
    const workspace = this._map.get(id);
    if (!workspace) {
      // ? 找不到不用报错的？？
      return false;
    }

    const tabData: TabInfo = {
      id: tab.id,
      url: tab.url,
      title: tab.title,
      favIconUrl: tab.favIconUrl,
      addedAt: $now(),
    };

    const except = (t: TabInfo) => t.id !== tab.id;
    const find = (t: TabInfo) => t.id === tab.id;

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
    const filter = (tab: TabInfo) => tab.id !== tabId;
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
      // ? 找不到不用报错的？？
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

  // ? 这个函数没人用？
  // Open work group in new window
  async openWorkspaceInWindow(id: string) {
    const workspace = this._map.get(id);
    if (!workspace) {
      return null;
    }

    try {
      // If group already has an active window, focus it
      if (workspace.windowId) {
        try {
          await browser.windows.update(workspace.windowId, { focused: true });
          return { id: workspace.windowId };
        } catch (error) {
          // Window doesn't exist anymore, clear the reference
          workspace.windowId = undefined;
        }
      }

      // Collect all URLs (pinned first, then regular)
      const allUrls: string[] = [];
      const pinnedUrls: string[] = [];
      for (let i = 0; i < workspace.pinnedTabs.length; i++) {
        const url = workspace.pinnedTabs[i].url;
        if (url) {
          allUrls.push(url);
          pinnedUrls.push(url);
        }
      }
      for (let i = 0; i < workspace.tabs.length; i++) {
        const url = workspace.tabs[i].url;
        if (url) {
          allUrls.push(url);
        }
      }

      if (allUrls.length === 0) {
        // Create window with new tab page if no URLs
        const window = await browser.windows.create({
          url: 'about:newtab',
          type: 'normal',
        });
        workspace.windowId = window.id;
        workspace.lastOpened = $now();
        await this.save();
        return window;
      }

      // Create new window with first URL
      const window = await browser.windows.create({
        url: allUrls[0],
        type: 'normal',
      });

      // Wait a moment for window to be ready
      await $sleep(500);

      // Open remaining URLs as tabs
      const createdTabs: { tab: browser.tabs.Tab; pinned: boolean }[] = [];
      for (let i = 1; i < allUrls.length; i++) {
        try {
          const tab = await browser.tabs.create({
            windowId: window.id,
            url: allUrls[i],
            active: false,
          });
          createdTabs.push({ tab, pinned: i <= pinnedUrls.length });
        } catch (error) {
          console.error(`Failed to create tab for URL: ${allUrls[i]}`, error);
        }
      }

      // Pin tabs that should be pinned
      for (let i = 0; i < createdTabs.length; i++) {
        const tab = createdTabs[i].tab;
        if (!createdTabs[i].pinned || !tab.id) {
          continue;
        }
        try {
          await browser.tabs.update(tab.id, { pinned: true });
        } catch (error) {
          console.error('__NAME__: Failed to pin tab:', error);
        }
      }

      // Pin the first tab if it should be pinned
      // ? 难道不需要都pin上？
      if (pinnedUrls.length > 0) {
        try {
          const tabs = await browser.tabs.query({ windowId: window.id });
          if (tabs.length > 0 && tabs[0].id) {
            await browser.tabs.update(tabs[0].id, { pinned: true });
          }
        } catch (error) {
          console.error('__NAME__: Failed to pin first tab:', error);
        }
      }

      // Update group with window association and last opened time
      workspace.windowId = window.id;
      workspace.lastOpened = Date.now();
      this.save();

      return window;
    } catch (error) {
      console.error('__NAME__: Failed to open work group in window:', error);
      return null;
    }
  }

  // Update work group tabs from window state
  async updateWorkspaceFromWindow(id: string, windowId: number | undefined) {
    const workspace = this._map.get(id);
    if (!workspace || workspace.windowId !== windowId) {
      return false;
    }
    try {
      const tabs = await browser.tabs.query({ windowId });

      // Clear existing tabs
      workspace.tabs = [];
      workspace.pinnedTabs = [];

      // Categorize tabs
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        const tabData: TabInfo = {
          id: tab.id ?? NaN,
          url: tab.url ?? '',
          title: tab.title ?? '',
          favIconUrl: tab.favIconUrl ?? '',
          addedAt: $now(),
        };

        if (tab.pinned) {
          workspace.pinnedTabs.push(tabData);
        } else {
          workspace.tabs.push(tabData);
        }
      }

      await this.save();
      return true;
    } catch (error) {
      console.error('__NAME__: Failed to update group from window:', error);
      return false;
    }
  }

  /**
   * Find work group by window ID
   *
   * ## Trivia
   *
   * [INFO] map.values is the fastest way to iterate Map values.
   * Tested for map.size = 1e7
   * - for...of map.values()    : 70.80 ms  (x1.00)
   * - for...of map.entries()   : 86.40 ms  (x1.22)
   * - for...of map             : 87.80 ms  (x1.24)
   * - map.forEach              : 133.20 ms  (x1.88)
   * - Array.from(map) + for i  : 643.30 ms  (x9.09)
   *
   * 🤣 But we finally decided to keep an array for indexed access and ordering.
   */
  getWorkspaceByWindowId(windowId: number): Workspace | null {
    for (let i = 0; i < this._arr.length; i++) {
      if (this._arr[i].windowId === windowId) {
        return this._arr[i];
      }
    }
    return null;
  }

  getWorkspaceStats(id: string): WorkspaceStats | null {
    const workspace = this._map.get(id);
    if (!workspace) {
      return null;
    }

    return {
      totalTabs: workspace.tabs.length + workspace.pinnedTabs.length,
      pinnedTabs: workspace.pinnedTabs.length,
      regularTabs: workspace.tabs.length,
      lastOpened: workspace.lastOpened,
      createdAt: workspace.createdAt,
      isActive: Boolean(workspace.windowId),
    };
  }

  // Save current session for all active work groups
  async saveActiveWorkspaceSessions() {
    for (let i = 0; i < this._arr.length; i++) {
      const workspace = this._arr[i];
      if (workspace.windowId === undefined) {
        continue;
      }
      try {
        await this.updateWorkspaceFromWindow(workspace.id, workspace.windowId);
      } catch (error) {
        console.error(`Failed to save session for group ${workspace.name}:`, error);
      }
    }
  }

  // Restore all work group sessions on startup
  async restoreGroupSessions() {
    for (let i = 0; i < this._arr.length; i++) {
      this._arr[i].windowId = undefined;
    }
    await this.save();
    console.log('Cleared stale window associations on startup');
  }

  // Get recently closed work groups
  getRecentlyClosedWorkspaces(limit: number = 5) {
    return this._arr
      .filter((workspace) => workspace.lastOpened && !workspace.windowId)
      .sort((a, b) => b.lastOpened - a.lastOpened)
      .slice(0, limit);
  }

  exportData(): ExportData {
    return {
      version: '__VERSION__',
      exportDate: $now(),
      workspaceses: this._arr,
    };
  }

  async importData(data: ExportData): Promise<boolean> {
    try {
      if (!$isArray(data.workspaceses)) {
        console.error(
          `__NAME__: Invalid data format, data.workspaceses must be an array of Workspace Data`
        );
        return false;
      }

      // Clear existing groups (with confirmation in UI)
      this._map.clear();
      this._arr.length = 0;

      // Import groups
      for (let i = 0; i < data.workspaceses.length; i++) {
        const workspace = data.workspaceses[i];
        const newWorkspace: IndexedWorkspace = {
          ...workspace,
          index: i,
          id: $genId(),
          windowId: undefined,
          lastOpened: NaN,
        };
        this._map.set(newWorkspace.id, newWorkspace);
        this._arr.push(newWorkspace);
      }

      await this.save();
      return true;
    } catch (error) {
      console.error('__NAME__: Failed to import data:', error);
      return false;
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorkspaceManager;
}
