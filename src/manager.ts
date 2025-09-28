import { Consts } from './lib/consts.js';
import { $createTabInfo, $genId, $sleep } from './lib/utils.js';

// Workspace Data Model and Storage Manager
export class WorkspaceManager {
  static getInstance() {
    if (!this._instance) {
      this._instance = new WorkspaceManager();
    }
    return this._instance;
  }

  private static _instance: WorkspaceManager;
  private readonly _map = new Map<string, IndexedWorkspace>();
  private readonly _arr: IndexedWorkspace[] = [];
  private readonly _activated: string[] = []; // Track currently opened workspaces by ID

  constructor() {
    this.init();
  }

  // Initialize the manager and load saved data
  async init() {
    try {
      await this.load();
      console.log('Workspaces Manager initialized');
    } catch (error) {
      console.error('[__NAME__: __func__] Failed to initialize Workspaces Manager:', error);
    }
  }

  get workspaces() {
    return this._arr;
  }

  // Get currently active/opened workspaces
  get activeWorkspaces(): string[] {
    return [...this._activated];
  }

  // Check if a workspace is currently active
  isActive(id: string): boolean {
    return this._activated.includes(id);
  }

  // Remove workspace from active list when window is closed
  deactivate(id: string) {
    const index = this._activated.indexOf(id);
    if (index !== -1) {
      this._activated.splice(index, 1);
    }
  }

  // Load work groups from browser storage
  async load() {
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
      const indexed = { ...list[i], index: i };
      this._map.set(list[i].id, indexed);
      this._arr[i] = indexed;
    }
  }

  async save() {
    const data: WorkspaceStoredData = { list: this._arr };
    try {
      await browser.storage.local.set(data);
    } catch (error) {
      console.error('[__NAME__: __func__] Failed to save workspaces:', error);
      return false;
    }
    return true;
  }

  async create(name: string, color: HexColor = '#667eea'): Promise<IndexedWorkspace> {
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

    await this.save();
    return workspace;
  }

  async update(id: string, updates: Partial<Workspace>) {
    const workspace = this._map.get(id);
    if (!workspace) {
      return null;
    }
    Object.assign(workspace, updates);
    await this.save();
    return workspace;
  }

  // Delete a workspace
  async delete(id: string): Promise<boolean> {
    const target = this._map.get(id);
    if (!target) {
      return false;
    }

    this._map.delete(id);
    this._arr.splice(target.index, 1);
    for (let i = target.index; i < this._arr.length; i++) {
      this._arr[i].index = i;
    }

    await this.save();
    return true;
  }

  get(id: string) {
    return this._map.get(id);
  }

  // Add tab to workspace
  async addTab(id: string, browserTab: browser.tabs.Tab, pinned: boolean = false) {
    const workspace = this._map.get(id);
    if (!workspace) {
      console.error(`[__NAME__: __func__]addTab Workspace with id ${id} not found`);
      return false;
    }

    const tab: TabInfo = $createTabInfo(browserTab);

    const except = (t: TabInfo) => t.id !== browserTab.id;
    const match = (t: TabInfo) => t.id === browserTab.id;

    if (pinned) {
      // Remove from regular tabs if exists
      workspace.tabs = workspace.tabs.filter(except);

      // Add to pinned tabs if not already there
      if (!workspace.pinnedTabs.find(match)) {
        workspace.pinnedTabs.push(tab);
      }
    } else {
      // Remove from pinned tabs if exists
      workspace.pinnedTabs = workspace.pinnedTabs.filter(except);
      // Add to regular tabs if not already there
      if (!workspace.tabs.find(match)) {
        workspace.tabs.push(tab);
      }
    }

    await this.save();
    return true;
  }

  async removeTab(id: string, tabId: number) {
    const workspace = this._map.get(id);
    if (!workspace) {
      return false;
    }
    const predicate = (t: TabInfo) => t.id !== tabId;
    workspace.tabs = workspace.tabs.filter(predicate);
    workspace.pinnedTabs = workspace.pinnedTabs.filter(predicate);
    await this.save();
    return true;
  }

  // Move tab between work groups
  async moveTabBetweenWorkspaces(fromId: string, toId: string, tabId: number): Promise<boolean> {
    const from = this._map.get(fromId);
    const to = this._map.get(toId);
    const predicate = (t: TabInfo) => t.id === tabId;

    if (!from || !to) {
      return false;
    }

    let pinned = false;
    // Find tab in source group
    const tab = from.tabs.find(predicate) ?? ((pinned = true), from.pinnedTabs.find(predicate));

    if (!tab) {
      return false;
    }

    // Remove from source group
    await this.removeTab(fromId, tabId);

    // Add to destination group with same pinned status
    // Here `tab` is found, so `maybePinned` is accurate `pinned`
    if (pinned) {
      to.pinnedTabs.push(tab);
    } else {
      to.tabs.push(tab);
    }

    await this.save();
    return true;
  }

  // Toggle tab pinned status within a group
  async toggleTabPin(id: string, tabId: number) {
    const workspace = this._map.get(id);
    if (!workspace) {
      console.error(`[__NAME__: __func__]toggleTabPin Workspace with id ${id} not found`);
      return false;
    }

    const predicate = (t: TabInfo) => t.id === tabId;

    // Check if tab is in regular tabs
    const tabIndex = workspace.tabs.findIndex(predicate);
    if (tabIndex !== -1) {
      // Move to pinned
      const tab = workspace.tabs.splice(tabIndex, 1)[0];
      workspace.pinnedTabs.push(tab);
      await this.save();
      return true;
    }

    // Check if tab is in pinned tabs
    const pinnedIndex = workspace.pinnedTabs.findIndex(predicate);
    if (pinnedIndex !== -1) {
      // Move to regular
      const tab = workspace.pinnedTabs.splice(pinnedIndex, 1)[0];
      workspace.tabs.push(tab);
      await this.save();
      return true;
    }
    return false;
  }

  // Open workspace in new window
  async open(id: string): Promise<{ id?: number } | null> {
    const workspace = this._map.get(id);
    if (!workspace) {
      return null;
    }

    try {
      // If group already has an active window, focus it
      if (workspace.windowId) {
        try {
          // Check if window still exists
          await browser.windows.get(workspace.windowId);
          await browser.windows.update(workspace.windowId, { focused: true });
          return { id: workspace.windowId };
        } catch {
          // Window doesn't exist anymore, clear the reference and remove from active list
          workspace.windowId = undefined;
          this.deactivate(id);
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
          url: 'about:blank',
          type: 'normal',
        });
        workspace.windowId = window.id;
        workspace.lastOpened = Date.now();
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

      // ?? 新增的设置标签页颜色
      // Set window title to include workspace name
      if (window.id) {
        try {
          // Get the first tab to update its title
          const tabs = await browser.tabs.query({ windowId: window.id });
          if (tabs.length > 0 && tabs[0].id) {
            // We'll inject a script to modify the document title
            await this.injectWorkspaceIdentifier(window.id, workspace.name, workspace.color);
          }
        } catch (error) {
          console.error('[__NAME__: __func__] Failed to set workspace identifier:', error);
        }
      }

      // Open remaining URLs as tabs
      const createdTabs: { tab: browser.tabs.Tab; pinned: boolean }[] = [];
      for (let i = 1; i < allUrls.length; i++) {
        try {
          const tab = await browser.tabs.create({
            windowId: window.id,
            url: allUrls[i],
            active: false,
          });
          // ?? Check if this URL should be pinned (in the first pinnedUrls.length URLs)
          const shouldPin = i < pinnedUrls.length;
          createdTabs.push({ tab, pinned: shouldPin });

          // ?? 新增的设置标签页颜色
          // Apply workspace identifier to each new tab
          if (tab.id) {
            await $sleep(200); // Small delay to ensure tab is ready
            await this.injectWorkspaceIdentifier(
              window.id,
              workspace.name,
              workspace.color,
              tab.id
            );
          }
        } catch (error) {
          console.error(`Failed to create tab for URL: ${allUrls[i]}`, error);
        }
      }

      // Pin the first tab if it should be pinned
      if (pinnedUrls.length > 0) {
        try {
          const tabs = await browser.tabs.query({ windowId: window.id });
          if (tabs.length > 0 && tabs[0].id) {
            await browser.tabs.update(tabs[0].id, { pinned: true });
          }
        } catch (error) {
          console.error('[__NAME__: __func__] Failed to pin first tab:', error);
        }
      }

      // Pin additional tabs that should be pinned
      for (let i = 0; i < createdTabs.length; i++) {
        const { tab, pinned } = createdTabs[i];
        if (!pinned || !tab.id) {
          continue;
        }
        try {
          await browser.tabs.update(tab.id, { pinned: true });
        } catch (error) {
          console.error('[__NAME__: __func__] Failed to pin tab:', error);
        }
      }

      // Update group with window association and last opened time
      workspace.windowId = window.id;
      workspace.lastOpened = Date.now();

      // Add to active workspaces if not already there
      !this._activated.includes(id) && this._activated.push(id);

      await this.save();

      return window;
    } catch (error) {
      console.error('[__NAME__: __func__] Failed to open workspace in window:', error);
      return null;
    }
  }

  // Update workspace tabs from window state
  async updateByWindowId(id: string, windowId: number | undefined) {
    const workspace = this._map.get(id);
    if (!workspace || workspace.windowId !== windowId) {
      return false;
    }
    try {
      const browserTabs = await browser.tabs.query({ windowId });

      // Clear existing tabs
      workspace.tabs = [];
      workspace.pinnedTabs = [];

      // Categorize tabs
      for (let i = 0; i < browserTabs.length; i++) {
        const browserTab = browserTabs[i];
        const tab: TabInfo = $createTabInfo(browserTab);
        if (browserTab.pinned) {
          workspace.pinnedTabs.push(tab);
        } else {
          workspace.tabs.push(tab);
        }
      }

      await this.save();
      return true;
    } catch (error) {
      console.error('[__NAME__: __func__] Failed to update group from window:', error);
      return false;
    }
  }

  /**
   * Find workspace by window ID
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
  getByWindowId(windowId: number): Workspace | null {
    for (let i = 0; i < this._arr.length; i++) {
      if (this._arr[i].windowId === windowId) {
        return this._arr[i];
      }
    }
    return null;
  }

  getStats(id: string): WorkspaceStats | null {
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
      isActive: workspace.windowId !== undefined,
    };
  }

  // Save current session for all active work groups
  async saveActiveSessions() {
    for (let i = 0; i < this._arr.length; i++) {
      const workspace = this._arr[i];
      if (workspace.windowId === undefined) {
        continue;
      }
      try {
        await this.updateByWindowId(workspace.id, workspace.windowId);
      } catch (error) {
        console.error(`Failed to save session for group ${workspace.name}:`, error);
      }
    }
  }

  // Restore all workspace sessions on startup
  async restoreSessions() {
    for (let i = 0; i < this._arr.length; i++) {
      this._arr[i].windowId = undefined;
    }
    // Clear active workspaces on startup
    this._activated.length = 0;
    await this.save();
    console.log('Cleared stale window associations and active workspaces on startup');
  }

  // Get recently closed work groups
  getRecentlyClosed(limit: number = 5) {
    return this._arr
      .filter((workspace) => workspace.lastOpened && !workspace.windowId)
      .sort((a, b) => b.lastOpened - a.lastOpened)
      .slice(0, limit);
  }

  exportData(): ExportData {
    return {
      version: '__VERSION__',
      exportDate: Date.now(),
      workspaceses: this._arr,
    };
  }

  async importData(data: ExportData): Promise<boolean> {
    try {
      if (!Array.isArray(data.workspaceses)) {
        console.error(
          `[__NAME__: __func__] Invalid data format, data.workspaceses must be an array of Workspace Data`
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
      console.error('[__NAME__: __func__] Failed to import data:', error);
      return false;
    }
  }

  // ?? 新增的设置标签页颜色
  // Inject workspace visual identifier into tabs
  private async injectWorkspaceIdentifier(
    windowId: number | undefined,
    workspaceName: string,
    workspaceColor: HexColor,
    tabId?: number
  ) {
    if (!windowId) return;

    try {
      // Create the code to inject with dynamic values
      // todo 这里可能要改成function定义而非字符串;
      const injectionCode = `
        (function() {
          const workspaceName = '${workspaceName.replace(/'/g, "\\'")}';
          const workspaceColor = '${workspaceColor}';
          
          // Remove existing workspace identifier if it exists
          const existingIdentifier = document.getElementById('workspace-identifier');
          if (existingIdentifier) {
            existingIdentifier.remove();
          }

          // Create workspace identifier bar
          const workspaceBar = document.createElement('div');
          workspaceBar.id = 'workspace-identifier';
          workspaceBar.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; height: 4px; background-color: ' + workspaceColor + '; z-index: 2147483647; box-shadow: 0 1px 3px rgba(0,0,0,0.2); pointer-events: none;';
          document.documentElement.appendChild(workspaceBar);

          // Update document title to include workspace name
          const originalTitle = document.title;
          const prefix = '[' + workspaceName + '] ';
          if (!originalTitle.startsWith(prefix)) {
            document.title = prefix + originalTitle;
          }
        })();
      `;

      if (tabId) {
        // Inject into specific tab
        try {
          // Try to use the newer scripting API first
          if (typeof browser.scripting !== 'undefined' && browser.scripting.executeScript) {
            await (browser.scripting.executeScript as any)({
              target: { tabId },
              code: injectionCode,
            });
          } else {
            // Fallback to older API
            await (browser.tabs as any).executeScript(tabId, {
              code: injectionCode,
            });
          }
        } catch (error) {
          console.debug('Could not inject workspace identifier into tab:', tabId);
        }
      } else {
        // Inject into all tabs in the window
        const tabs = await browser.tabs.query({ windowId });
        for (const tab of tabs) {
          if (tab.id) {
            try {
              if (typeof browser.scripting !== 'undefined' && browser.scripting.executeScript) {
                await (browser.scripting.executeScript as any)({
                  target: { tabId: tab.id },
                  code: injectionCode,
                });
              } else {
                await (browser.tabs as any).executeScript(tab.id, {
                  code: injectionCode,
                });
              }
            } catch (error) {
              console.debug('Could not inject workspace identifier into tab:', tab.url);
            }
          }
        }
      }
    } catch (error) {
      console.error('[__NAME__: __func__] Failed to inject workspace identifier:', error);
    }
  }

  // ?? 新增的设置标签页颜色
  // Public method to apply workspace identifier to a specific tab
  async applyWorkspaceIdentifier(windowId: number, tabId?: number) {
    const workspace = this.getByWindowId(windowId);
    if (!workspace) {
      return false;
    }

    await this.injectWorkspaceIdentifier(windowId, workspace.name, workspace.color, tabId);
    return true;
  }
}

// // Export for use in other scripts
// if (typeof module !== 'undefined' && module.exports) {
//   module.exports = WorkspaceManager;
// }
