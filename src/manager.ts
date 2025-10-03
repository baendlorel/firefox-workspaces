import './lib/promise-ext.js';
import { Color } from './lib/color.js';
import { Sym } from './lib/consts.js';
import { $aboutBlank, $lsget, $lsset, i } from './lib/ext-apis.js';
import { $sleep } from './lib/utils.js';
import { WorkspaceTab } from './lib/workspace-tab.js';
import { Workspace } from './lib/workspace.js';
import { WorkspaceContainer } from './containers/workspaces.js';
import { TabContainer } from './containers/tabs.js';
import { FlatPair } from './lib/flat-pair.js';

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
    const updatedAt = new Date('__DATE_TIME__');
    const delta = Date.now() - updatedAt.getTime();
    const min = Math.floor(delta / 60000);
    const time = min < 1 ? i('justNow') : i('minutesAgo', min);
    logger.info('Updated before ' + time);
  }

  // Get currently active/opened workspaces
  get activeWorkspaces(): string[] {
    return this.workspaces.activated;
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
    const workspaceToWindow = await $lsget('workspaceToWindow');

    const windowId = FlatPair.find<string, number>(workspaceToWindow, workspace.id);
    if (windowId) {
      // Check if window still exists
      const result = await browser.windows
        .update(windowId, { focused: true })
        .fallback('__func__: Window update failed');

      if (result !== Sym.Reject) {
        return { id: windowId };
      }

      // & Window doesn't exist anymore, clear the reference and remove from active list
      FlatPair.delete(workspaceToWindow, workspace.id);
      await $lsset({ workspaceToWindow });
    }

    const tabs = workspace.tabs.sort((a, b) => a.index - b.index);

    if (tabs.length === 0) {
      // Create window with new tab page if no URLs
      const window = await $aboutBlank();
      this.setBadge(workspace, window.id);
      FlatPair.add<string, number>(workspaceToWindow, workspace.id, window.id);
      await $lsset({ workspaceToWindow });

      // & should not be NaN
      return { id: window.id ?? NaN };
    }

    // Create new window with first URL
    const window = (await browser.windows
      .create({ url: tabs[0].url, type: 'normal' })
      .fallback('__func__: Fallback to about:blank because', $aboutBlank)) as WindowWithId;
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
    FlatPair.add<string, number>(workspaceToWindow, workspace.id, window.id);
    await $lsset({ workspaceToWindow });

    return window;
  }

  // Update workspace tabs from window state
  async updateTabsOfWorkspace(workspace: Workspace): Promise<boolean> {
    const workspaceToWindow = await $lsget('workspaceToWindow');
    const windowId = FlatPair.find<string, number>(workspaceToWindow, workspace.id);
    if (windowId === undefined) {
      logger.error('Inactivated workspace has no windowId:', workspace);
      return false;
    }

    const browserTabs = await browser.tabs.query({ windowId });
    workspace.tabs = browserTabs.map(WorkspaceTab.from);

    return true;
  }

  // todo 貌似session可以访问到最近关闭的标签页。是否可以用这个办法来保存标签页呢？
  // todo 是否可以人工创建一个popup窗口，然后位置设置在屏幕外面，触发focus和选择文件，处理后关闭窗口
  async importData(state: WorkspacePersistant) {
    if (!Array.isArray(state.workspaces) || state.workspaces.some((w) => !Workspace.valid(w))) {
      logger.error('data.workspaceses must be Workspace[]', state);
      return;
    }
  }
}
