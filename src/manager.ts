import './lib/promise-ext.js';
import { Color } from './lib/color.js';
import { Consts, Sym } from './lib/consts.js';
import { $aboutBlank, $lsget, i } from './lib/ext-apis.js';
import { $sleep } from './lib/utils.js';
import { WorkspaceTab } from './lib/workspace-tab.js';
import { IndexedWorkspace, Workspace } from './lib/workspace.js';
import { WorkspaceContainer } from './containers/workspaces.js';
import { TabContainer } from './containers/tabs.js';

// Workspace Data Model and Storage Manager
// todo 准备删除不需要的containers类，转为使用数组或数组衍生类
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
  readonly needPin = new Set<number>();

  constructor() {
    this.load().then(() => {
      const updatedAt = new Date('__DATE_TIME__');
      const delta = Date.now() - updatedAt.getTime();
      const min = Math.floor(delta / 60000);
      const time = min < 1 ? i('justNow') : i('minutesAgo', min);
      logger.info('Updated before ' + time);
    });
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
    const workspaces = (await browser.storage.local.get(Consts.StorageKey)) as WorkspaceState;
    if (!workspaces.workspaces) {
      return;
    }

    const list = workspaces.workspaces;
    const len = workspaces.workspaces.length;

    // prepare the containers
    this.workspaces.clearAll();
    this.tabs.clearAll();

    // initialize 2 containers
    for (let i = 0; i < len; i++) {
      const indexed = IndexedWorkspace.load(i, list[i]);
      this.workspaces.add(indexed);
    }
  }

  async create(raw: WorkspaceFormData): Promise<IndexedWorkspace> {
    const workspace = this.workspaces.create(raw);
    await this.save();
    return workspace;
  }

  setBadge(workspace: WorkspacePlain, windowId?: number) {
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
  async open(workspace: WorkspacePlain): Promise<{ id: number } | null> {
    // If group already has an active window, focus it
    const activatedMap = await $lsget('activatedMap');

    // todo 应该找到一个辅助方法来做这件事
    const windowId = workspace.id;
    if (windowId) {
      // Check if window still exists
      const result = await browser.windows
        .update(windowId, { focused: true })
        .fallback('__func__: Window update failed');

      if (result !== Sym.Reject) {
        return { id: windowId };
      }

      // Window doesn't exist anymore, clear the reference and remove from active list
      workspace.windowId = undefined;
      this.workspaces.deactivate(workspace.id);
    }

    const tabs = workspace.tabs.sort((a, b) => a.index - b.index);

    if (tabs.length === 0) {
      // Create window with new tab page if no URLs
      const window = await $aboutBlank();
      this.setBadge(workspace, window.id);
      workspace.setWindowId(window.id);
      await this.save();

      // & should not be NaN
      return { id: window.id ?? NaN };
    }

    // Create new window with first URL
    const window = await browser.windows
      .create({ url: tabs[0].url, type: 'normal' })
      .fallback('__func__: Fallback to about:blank because', $aboutBlank);
    this.setBadge(workspace, window.id);

    // Wait a moment for window to be ready
    await $sleep(500);

    logger.debug('tabs', tabs);

    const firstTabId = window.tabs?.[0].id;
    if (tabs[0].pinned && firstTabId !== undefined) {
      this.needPin.add(firstTabId);
    }

    // Open remaining URLs as tabs
    for (let i = 1; i < tabs.length; i++) {
      const tab = await browser.tabs
        .create({
          windowId: window.id,
          url: tabs[i].url,
          active: false,
          index: tabs[i].index,
        })
        .fallback(`__func__: Failed to create tab for URL: ${tabs[i].url}`);

      if (tab === Sym.Reject) {
        continue;
      }

      if (tabs[i].pinned && tab.id !== undefined) {
        this.needPin.add(tab.id);
      }
    }

    // * Pin tabs are handled in OnUpdated listener

    // Update group with window association and last opened time
    workspace.setWindowId(window.id);

    // Add to active workspaces if not already there
    this.workspaces.activate(id);

    await this.save();

    return window;
  }

  // Update workspace tabs from window state
  async updateTabsOfWorkspace(workspace: Workspace): Promise<boolean> {
    const browserTabs = await browser.tabs.query({ windowId: workspace.windowId });
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

      const succ = await this.updateTabsOfWorkspace(workspace);
      if (succ === false) {
        logger.error(`failed: ${workspace.name}(${workspace.id})`);
      }
    }
  }

  // todo 貌似session可以访问到最近关闭的标签页。是否可以用这个办法来保存标签页呢？
  // Restore all workspace sessions on startup
  async restoreSessions() {}

  // Get recently closed work groups
  getRecentlyClosed(limit: number = 5) {
    return this.workspaces.arr
      .filter((workspace) => workspace.lastOpened && !workspace.windowId)
      .sort((a, b) => b.lastOpened - a.lastOpened)
      .slice(0, limit);
  }

  async importData(state: WorkspaceState) {
    if (!Array.isArray(state.workspaces)) {
      logger.error('data.workspaceses must be Workspace[]', state);
      return;
    }

    // todo 校验
  }
}
