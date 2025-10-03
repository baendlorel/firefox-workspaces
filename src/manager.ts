import './lib/promise-ext.js';
import { Color } from './lib/color.js';
import { Sym } from './lib/consts.js';
import { FlatPair } from './lib/flat-pair.js';
import { $aboutBlank, $lsget, $lsset, i } from './lib/ext-apis.js';
import { $sleep } from './lib/utils.js';
import { WorkspaceTab } from './lib/workspace-tab.js';
import { isValidWorkspace } from './lib/workspace.js';

// Workspace Data Model and Storage Manager
export class WorkspaceManager {
  // todo background会按需销毁，数据要另想办法存储
  // # containers
  /**
   * Indicates it is a workspace window
   */
  readonly workspaceWindows = new Set<number>();

  /**
   * Stores tabs of each window by windowId
   * - will save to workspace when window is closed
   */
  readonly windowTabs: Map<number, browser.tabs.Tab[]> = new Map();

  constructor() {
    const updatedAt = new Date('__DATE_TIME__');
    const delta = Date.now() - updatedAt.getTime();
    const min = Math.floor(delta / 60000);
    const time = min < 1 ? i('justNow') : i('minutesAgo', min);
    logger.info('Updated before ' + time);
  }

  /**
   * Get the cached tabs of a window and transform to `WorkspaceTab[]`
   */
  getWindowTabs(windowId: number): WorkspaceTab[] {
    const browserTabs = this.windowTabs.get(windowId) ?? [];
    return browserTabs.map(WorkspaceTab.from);
  }

  addWindowTab(browserTab: browser.tabs.Tab) {
    if (browserTab.windowId === undefined || !this.workspaceWindows.has(browserTab.windowId)) {
      return;
    }

    const raw = this.windowTabs.get(browserTab.windowId);
    if (raw) {
      raw.push(browserTab);
    } else {
      this.windowTabs.set(browserTab.windowId, [browserTab]);
    }
  }

  async refreshWindowTab(windowId: number | undefined) {
    if (!this.workspaceWindows.has(windowId as number)) {
      return;
    }

    const tabs = await browser.tabs.query({ windowId });
    this.windowTabs.set(windowId as number, tabs);
  }

  /**
   * Remove the pair of `workspaceToWindow` in store
   */
  async deactivate(id: string) {
    const { workspaceToWindow } = await $lsget('workspaceToWindow');
    FlatPair.delete(workspaceToWindow, id);
    await $lsset({ workspaceToWindow });
  }

  async save(workspace: WorkspacePlain) {
    const { workspaces } = await $lsget('workspaces');
    const index = workspaces.findIndex((w) => w.id === workspace.id);
    if (index !== -1) {
      workspaces[index] = workspace;
    } else {
      workspaces.push(workspace);
    }
    await $lsset({ workspaces });
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
    const { workspaceToWindow } = await $lsget('workspaceToWindow');

    // & closed window will be deleted by `this.deactivate`, so windowId found here must be valid
    const windowId = FlatPair.find<string, number>(workspaceToWindow, workspace.id);
    if (windowId) {
      // Check if window still exists
      const result = await browser.windows
        .update(windowId, { focused: true })
        .fallback('__func__: Window update failed');

      return result === Sym.Reject ? null : { id: windowId };
    }

    const tabs = workspace.tabs.sort((a, b) => a.index - b.index);
    if (tabs.length === 0) {
      const window = await $aboutBlank();
      await this.openIniter(workspace, window, workspaceToWindow);

      // & Theoretically, `id` won't be NaN
      return { id: window.id ?? NaN };
    }

    // Create new window with first URL
    const window = (await browser.windows
      .create({ url: tabs[0].url, type: 'normal' })
      .fallback('__func__: Fallback to about:blank because', $aboutBlank)) as WindowWithId;

    // Wait a moment for window to be ready
    await $sleep(600);

    // Open remaining URLs as tabs
    for (let i = 1; i < tabs.length; i++) {
      const tab = await browser.tabs
        .create({
          windowId: window.id,
          url: tabs[i].url,
          active: false,
          // pinned: tabs[i].pinned, // * This might not work 😔, so handle it again with `this.needPin`
          index: tabs[i].index,
        })
        .fallback(`__func__: Failed to create tab for URL: ${tabs[i].url}`);

      if (tab === Sym.Reject) {
        continue;
      }
    }

    // & Pin tabs are handled in OnUpdated listener
    await this.openIniter(workspace, window, workspaceToWindow);
    return window;
  }

  /**
   * init function used only in `this.open`
   */
  private async openIniter(
    workspace: WorkspacePlain,
    window: WindowWithId,
    workspaceToWindow: (string | number)[]
  ) {
    this.setBadge(workspace, window.id);
    this.workspaceWindows.add(window.id);
    FlatPair.add<string, number>(workspaceToWindow, workspace.id, window.id);
    await $lsset({ workspaceToWindow });
  }

  // Update workspace tabs from window state
  async updateTabsOfWorkspace(workspace: WorkspacePlain): Promise<boolean> {
    const { workspaceToWindow } = await $lsget('workspaceToWindow');
    const windowId = FlatPair.find<string, number>(workspaceToWindow, workspace.id);
    if (windowId === undefined) {
      logger.error('Inactivated workspace has no windowId:', workspace);
      return false;
    }

    const browserTabs = await browser.tabs.query({ windowId });
    workspace.tabs = browserTabs.map(WorkspaceTab.from);

    return true;
  }

  // todo 是否可以人工创建一个popup窗口，然后位置设置在屏幕外面，触发focus和选择文件，处理后关闭窗口
  async importData(state: WorkspacePersistant) {
    if (!Array.isArray(state.workspaces) || state.workspaces.some((w) => !isValidWorkspace(w))) {
      logger.error('data.workspaceses must be Workspace[]', state);
      return;
    }
  }
}
