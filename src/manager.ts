import './lib/promise-ext.js';
import { Color } from './lib/color.js';
import { Consts, Sym } from './lib/consts.js';
import { $aboutBlank } from './lib/ext-apis.js';
import { $genId, $sleep } from './lib/utils.js';
import { WorkspaceTab } from './lib/workspace-tab.js';
import { IndexedWorkspace, Workspace } from './lib/workspace.js';
import { WorkspaceContainer } from './containers/workspaces.js';
import { TabContainer } from './containers/tabs.js';

// Workspace Data Model and Storage Manager
export class WorkspaceManager {
  static getInstance() {
    if (!this._instance) {
      this._instance = new WorkspaceManager();
    }
    return this._instance;
  }

  private static _instance: WorkspaceManager;

  // # containers
  readonly workspaces = new WorkspaceContainer();
  readonly tabs = new TabContainer();

  constructor() {
    this.load().then(() => logger.info('Updated at __DATE_TIME__'));
  }

  // Get currently active/opened workspaces
  get activeWorkspaces(): string[] {
    return this.workspaces.activated;
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
    this.workspaces.clearAll();
    this.tabs.clearAll();

    // initialize 2 containers
    for (let i = 0; i < len; i++) {
      const indexed = IndexedWorkspace.load(i, list[i]);
      this.workspaces.add(indexed);
    }
  }

  /**
   * Save workspace data
   * - Won't throw
   */
  save(): Promise<boolean> {
    const data: WorkspaceStoredData = { list: this.workspaces.arr };
    return browser.storage.local
      .set(data)
      .then(() => true)
      .fallback('__func__: Saving failed', false);
  }

  async create(name: string, color: HexColor): Promise<IndexedWorkspace> {
    const workspace = this.workspaces.create(name, color);
    await this.save();
    return workspace;
  }

  async update(id: string, updates: Partial<Workspace>) {
    const workspace = this.workspaces.get(id);
    if (!workspace) {
      return null;
    }
    Object.assign(workspace, updates);
    await this.save();
    return workspace;
  }

  // Delete a workspace
  async delete(id: string): Promise<boolean> {
    const target = this.workspaces.get(id);
    if (!target) {
      return false;
    }

    // Mark this workspace as being deleted to avoid conflicts with window close events
    this.workspaces.addDeleting(id);

    // If workspace has an active window, close it before deletion
    if (target.windowId !== undefined) {
      await browser.windows
        .remove(target.windowId)
        .then(() => logger.info(`Closed window ${target.windowId} for workspace: ${target.name}`))
        .fallback(`Window ${target.windowId} was already closed or doesn't exist:`);

      // Remove from active workspaces list
      this.workspaces.deactivate(id);
    }

    this.workspaces.delete(id);
    await this.save();
    return true;
  }

  // Add tab to workspace
  async addTab(id: string, browserTab: browser.tabs.Tab) {
    const workspace = this.workspaces.get(id);
    if (!workspace) {
      logger.WorkspaceNotFound(id);
      return false;
    }

    const tab = WorkspaceTab.from(browserTab);
    if (!workspace.tabs.some((t) => t.id === browserTab.id)) {
      workspace.tabs.push(tab);
    }

    return this.save();
  }

  async removeTab(id: string, tabId: number) {
    const workspace = this.workspaces.get(id);
    if (!workspace) {
      logger.WorkspaceNotFound(id);
      return false;
    }

    workspace.tabs = workspace.tabs.filter((t) => t.id !== tabId);
    return this.save();
  }

  // Move tab between work groups
  async moveTabBetweenWorkspaces(fromId: string, toId: string, tabId: number): Promise<boolean> {
    const from = this.workspaces.get(fromId);
    const to = this.workspaces.get(toId);

    if (!from || !to) {
      return false;
    }

    // Find tab in source group
    const tab = from.tabs.find((t) => t.id === tabId);
    if (!tab) {
      logger.TabNotFoundInWorkspace(fromId, tabId);
      return false;
    }

    // Remove from source group
    await this.removeTab(fromId, tabId);

    // Add to destination group
    to.tabs.push(tab);

    return this.save();
  }

  // Toggle tab pinned status within a group
  async toggleTabPin(id: string, tabId: number) {
    const workspace = this.workspaces.get(id);
    if (!workspace) {
      logger.WorkspaceNotFound(id);
      return false;
    }

    // Check if tab is in regular tabs
    const tab = workspace.tabs.find((t) => t.id === tabId);
    if (!tab) {
      logger.TabNotFoundInWorkspace(id, tabId);
      return false;
    }

    tab.pinned = !tab.pinned;
    return this.save();
  }

  setBadge(workspace: Workspace, windowId?: number) {
    if (!windowId) {
      logger.debug('Not setting badge, no windowId');
      return;
    }

    const spaceIndex = workspace.name.indexOf(' ');
    const name =
      spaceIndex === -1
        ? workspace.name.slice(0, 2)
        : workspace.name[0] + workspace.name[spaceIndex + 1];

    browser.action.setBadgeBackgroundColor({ color: workspace.color, windowId });
    browser.action.setBadgeText({ text: name, windowId });
    const color = Color.from(workspace.color);
    const textColor = color.brightness < 128 ? '#F8F9FA' : '#212729';
    browser.action.setBadgeTextColor({ color: textColor, windowId });
  }

  // Open workspace in new window
  async open(id: string): Promise<{ id?: number } | null> {
    const workspace = this.workspaces.get(id);
    if (!workspace) {
      logger.WorkspaceNotFound(id);
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
      this.workspaces.deactivate(id);
    }

    const tabs = workspace.tabs;

    if (tabs.length === 0) {
      // Create window with new tab page if no URLs
      const window = await $aboutBlank();
      this.setBadge(workspace, window.id);
      workspace.setWindowId(window.id);
      await this.save();
      return window;
    }

    // Create new window with first URL
    const window = await browser.windows
      .create({
        url: tabs[0].url,
        type: 'normal',
      })
      .fallback('__func__: Fallback to about:blank because', $aboutBlank);
    this.setBadge(workspace, window.id);

    // Wait a moment for window to be ready
    await $sleep(500);

    // Open remaining URLs as tabs
    for (let i = 1; i < tabs.length; i++) {
      const tab = await browser.tabs
        .create({
          windowId: window.id,
          url: tabs[i].url,
          active: false,
          pinned: tabs[i].pinned,
        })
        .fallback(`__func__: Failed to create tab for URL: ${tabs[i].url}`, null);

      if (tab === null) {
        continue;
      }
    }

    // Update group with window association and last opened time
    workspace.setWindowId(window.id);

    // Add to active workspaces if not already there
    this.workspaces.activate(id);

    await this.save();

    return window;
  }

  // Update workspace tabs from window state
  async updateByWindowId(id: string, windowId: number): Promise<boolean> {
    const workspace = this.workspaces.get(id);
    if (!workspace || workspace.windowId !== windowId) {
      return false;
    }
    const browserTabs = await browser.tabs.query({ windowId });
    workspace.tabs = browserTabs.map(WorkspaceTab.from);

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
    const arr = this.workspaces.arr;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].windowId === windowId) {
        return arr[i];
      }
    }
    return null;
  }

  getStats(id: string): WorkspaceStats | null {
    const workspace = this.workspaces.get(id);
    if (!workspace) {
      return null;
    }

    return {
      totalTabs: workspace.tabs.length,
      pinnedTabs: workspace.tabs.filter((tab) => tab.pinned).length,
      regularTabs: workspace.tabs.length,
      lastOpened: workspace.lastOpened,
      createdAt: workspace.createdAt,
      isActive: workspace.windowId !== undefined,
    };
  }

  // Save current session for all active work groups
  async saveActiveSessions() {
    const arr = this.workspaces.arr;
    for (let i = 0; i < arr.length; i++) {
      const workspace = arr[i];
      if (workspace.windowId === undefined) {
        continue;
      }

      // todo 能改成入参是workspace而不是.id吗。这个是需要的因为会回收内存
      const succ = await this.updateByWindowId(workspace.id, workspace.windowId);
      if (succ === false) {
        logger.error(`failed: ${workspace.name}(${workspace.id})`);
      }
    }
  }

  // Restore all workspace sessions on startup
  async restoreSessions() {
    const arr = this.workspaces.arr;
    for (let i = 0; i < arr.length; i++) {
      arr[i].windowId = undefined;
    }
    // Clear active workspaces on startup
    this.workspaces.deactivateAll();
    await this.save();
    logger.info('Cleared stale window associations and active workspaces on startup');
  }

  // Get recently closed work groups
  getRecentlyClosed(limit: number = 5) {
    return this.workspaces.arr
      .filter((workspace) => workspace.lastOpened && !workspace.windowId)
      .sort((a, b) => b.lastOpened - a.lastOpened)
      .slice(0, limit);
  }

  exportData(): ExportData {
    return {
      version: '__VERSION__',
      exportDate: Date.now(),
      workspaceses: this.workspaces.arr,
    };
  }

  async importData(data: ExportData): Promise<boolean> {
    if (!Array.isArray(data.workspaceses)) {
      logger.error('data.workspaceses must be Workspace[]', data);
      return false;
    }

    // Clear existing groups (with confirmation in UI)
    this.workspaces.clear();

    // Import groups
    for (let i = 0; i < data.workspaceses.length; i++) {
      const workspace = IndexedWorkspace.load(i, data.workspaceses[i]);
      // prevent ID conflicts
      workspace.id = $genId();
      this.workspaces.add(workspace);
    }

    return this.save();
  }
}
