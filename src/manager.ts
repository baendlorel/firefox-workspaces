import { Color } from './lib/color.js';
import { Consts, Sym } from './lib/consts.js';
import { $aboutBlank } from './lib/ext-apis.js';
import { $createTabInfo, $genId, $sleep, reject } from './lib/utils.js';

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
  private readonly _deleting = new Set<string>(); // Track workspaces being deleted to avoid conflicts

  constructor() {
    this.init();
  }

  // Initialize the manager and load saved data
  async init() {
    await this.load();
    console.log('__NAME__ initialized. Updated at __DATE_TIME__');
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

  // Check if a workspace is currently being deleted
  isDeleting(id: string): boolean {
    return this._deleting.has(id);
  }

  // Remove workspace from active list when window is closed
  deactivate(id: string) {
    const index = this._activated.indexOf(id);
    if (index !== -1) {
      this._activated.splice(index, 1);
    }
  }

  /**
   * Load work groups from browser storage
   * - Won't throw
   */
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

  /**
   * Save workspace data
   * - Won't throw
   */
  save(): Promise<boolean> {
    const data: WorkspaceStoredData = { list: this._arr };
    return browser.storage.local
      .set(data)
      .then(() => true)
      .fallback('__func__: Saving failed', false);
  }

  async create(name: string, color: HexColor): Promise<IndexedWorkspace> {
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

    // Mark this workspace as being deleted to avoid conflicts with window close events
    this._deleting.add(id);

    // If workspace has an active window, close it before deletion
    if (target.windowId !== undefined) {
      await browser.windows
        .remove(target.windowId)
        .then(() => console.log(`Closed window ${target.windowId} for workspace: ${target.name}`))
        .fallback(__func__, `Window ${target.windowId} was already closed or doesn't exist:`);

      // Remove from active workspaces list
      this.deactivate(id);
    }

    this._map.delete(id);
    this._arr.splice(target.index, 1);
    for (let i = target.index; i < this._arr.length; i++) {
      this._arr[i].index = i;
    }

    await this.save();
    this._deleting.delete(id);
    return true;
  }

  get(id: string) {
    return this._map.get(id);
  }

  // Add tab to workspace
  async addTab(id: string, browserTab: browser.tabs.Tab, pinned: boolean = false) {
    const workspace = this._map.get(id);
    if (!workspace) {
      console.error(`[__NAME__] :__func__:addTab Workspace with id ${id} not found`);
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
      console.error(`[__NAME__] __func__: toggleTabPin Workspace with id ${id} not found`);
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

  setBadge(workspace: Workspace, windowId?: number) {
    browser.action.setBadgeBackgroundColor({ color: workspace.color, windowId });
    browser.action.setBadgeText({ text: workspace.name.slice(0, 2), windowId });
    const color = Color.from(workspace.color);
    console.log('color.brightness', color.brightness, color);
    const textColor = color.brightness < 128 ? '#F8F9FA' : '#212729';
    browser.action.setBadgeTextColor({ color: textColor, windowId });
  }

  // Open workspace in new window
  async open(id: string): Promise<{ id?: number } | null> {
    const workspace = this._map.get(id);
    if (!workspace) {
      return null;
    }

    // If group already has an active window, focus it
    if (workspace.windowId) {
      // Check if window still exists
      const result = await browser.windows
        .update(workspace.windowId, { focused: true })
        .then(() => ({ id: workspace.windowId }))
        .fallback('__func__: Window update failed');

      if (result !== Sym.Reject) {
        return result;
      }

      // Window doesn't exist anymore, clear the reference and remove from active list
      workspace.windowId = undefined;
      this.deactivate(id);
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
      const window = await $aboutBlank();
      this.setBadge(workspace, window.id);
      workspace.windowId = window.id;
      workspace.lastOpened = Date.now();
      await this.save();
      return window;
    }

    // Create new window with first URL
    const window = await browser.windows
      .create({
        url: allUrls[0],
        type: 'normal',
      })
      .fallback('__func__: Fallback to about:blank because', $aboutBlank());
    this.setBadge(workspace, window.id);

    // Wait a moment for window to be ready
    await $sleep(500);

    // Open remaining URLs as tabs
    const createdTabs: { tab: browser.tabs.Tab; pinned: boolean }[] = [];
    for (let i = 1; i < allUrls.length; i++) {
      const tab = await browser.tabs
        .create({
          windowId: window.id,
          url: allUrls[i],
          active: false,
        })
        .fallback(`__func__: Failed to create tab for URL: ${allUrls[i]}`, null);

      if (tab === null) {
        continue;
      }
      // ?? Check if this URL should be pinned (in the first pinnedUrls.length URLs)
      const shouldPin = i < pinnedUrls.length;
      createdTabs.push({ tab, pinned: shouldPin });
    }

    // Pin the first tab if it should be pinned
    if (pinnedUrls.length > 0) {
      const tabs = await browser.tabs.query({ windowId: window.id });
      if (tabs.length > 0 && tabs[0].id) {
        await browser.tabs
          .update(tabs[0].id, { pinned: true })
          .fallback('__func__: Failed to pin the first tab');
      }
    }

    // Pin additional tabs that should be pinned
    for (let i = 0; i < createdTabs.length; i++) {
      const { tab, pinned } = createdTabs[i];
      if (!pinned || !tab.id) {
        continue;
      }
      await browser.tabs.update(tab.id, { pinned: true }).then(reject('Failed to pin tab:'));
    }

    // Update group with window association and last opened time
    workspace.windowId = window.id;
    workspace.lastOpened = Date.now();

    // Add to active workspaces if not already there
    !this._activated.includes(id) && this._activated.push(id);

    await this.save();

    return window;
  }

  // Update workspace tabs from window state
  async updateByWindowId(id: string, windowId: number | undefined): Promise<boolean> {
    const workspace = this._map.get(id);
    if (!workspace || workspace.windowId !== windowId) {
      return false;
    }
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

    return this.save();
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

      const succ = await this.updateByWindowId(workspace.id, workspace.windowId);
      if (succ === false) {
        console.error(`[__NAME__:__func__] failed: ${workspace.name}(${workspace.id})`);
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
    if (!Array.isArray(data.workspaceses)) {
      console.error(`[__NAME__] __func__: data.workspaceses must be Workspace[]`);
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

    this.save();
    return this.save();
  }
}

// // Export for use in other scripts
// if (typeof module !== 'undefined' && module.exports) {
//   module.exports = WorkspaceManager;
// }
