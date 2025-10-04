import { get, set, has, remove, hasByValue } from 'flat-pair';

import './lib/promise-ext.js';
import { Color } from './lib/color.js';
import { Sym } from './lib/consts.js';
import { i, $aboutBlank, $lget, $lpset, $lsset } from './lib/ext-apis.js';
import { $sleep } from './lib/utils.js';
import { WorkspaceTab } from './lib/workspace-tab.js';
import { isValidWorkspace } from './lib/workspace.js';

export class WorkspaceManager {
  /**
   * Get the cached tabs of a window and transform to `WorkspaceTab[]`
   */
  async getWindowTabs(windowId: number): Promise<WorkspaceTab[]> {
    const { _windowTabs } = await $lget('_windowTabs');
    const browserTabs = get<number, browser.tabs.Tab[]>(_windowTabs, windowId) ?? [];
    return browserTabs.map(WorkspaceTab.from);
  }

  async addWindowTab(browserTab: browser.tabs.Tab) {
    const { _workspaceWindows, _windowTabs } = await $lget('_workspaceWindows', '_windowTabs');
    if (browserTab.windowId === undefined || !has(_workspaceWindows, browserTab.windowId)) {
      return;
    }

    const rawTabs = get<number, browser.tabs.Tab[]>(_windowTabs, browserTab.windowId);
    if (rawTabs) {
      rawTabs.push(browserTab);
    } else {
      set(_windowTabs, browserTab.windowId, [browserTab]);
    }
    await $lsset({ _windowTabs });
  }

  async refreshWindowTab(windowId: number | undefined) {
    const { _workspaceWindows, _windowTabs } = await $lget('_workspaceWindows', '_windowTabs');
    if (!hasByValue(_workspaceWindows, windowId)) {
      return;
    }

    const tabs = await browser.tabs.query({ windowId });
    set(_windowTabs, windowId as number, tabs);
    await $lsset({ _windowTabs });
  }

  /**
   * Remove the pair of `workspaceToWindow` in store
   */
  async deactivate(id: string) {
    const { _workspaceWindows } = await $lget('_workspaceWindows');
    remove(_workspaceWindows, id);
    await $lsset({ _workspaceWindows });
  }

  async save(workspace: Workspace) {
    const { workspaces } = await $lget('workspaces');
    const index = workspaces.findIndex((w) => w.id === workspace.id);
    if (index !== -1) {
      workspaces[index] = workspace;
    } else {
      workspaces.push(workspace);
    }
    await $lpset({ workspaces });
  }

  setBadge(workspace: Workspace, windowId: number) {
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
  async open(workspace: Workspace): Promise<{ id: number } | null> {
    // If group already has an active window, focus it
    const { _workspaceWindows } = await $lget('_workspaceWindows');

    // & closed window will be deleted by `this.deactivate`, so windowId found here must be valid
    const windowId = get<string, number>(_workspaceWindows, workspace.id);
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
      await this.openIniter(workspace, window, _workspaceWindows);

      return { id: window.id };
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
    await this.openIniter(workspace, window, _workspaceWindows);
    return window;
  }

  /**
   * init function used only in `this.open`
   */
  private async openIniter(
    workspace: Workspace,
    window: WindowWithId,
    _workspaceWindows: (string | number)[]
  ) {
    this.setBadge(workspace, window.id);
    set<string, number>(_workspaceWindows, workspace.id, window.id);
    await $lsset({ _workspaceWindows });
  }

  // Update workspace tabs from window state
  async updateTabsOfWorkspace(workspace: Workspace): Promise<void> {
    const { _workspaceWindows } = await $lget('_workspaceWindows');
    const windowId = get<string, number>(_workspaceWindows, workspace.id);
    if (windowId === undefined) {
      logger.error('Inactivated workspace has no windowId:', workspace);
      return;
    }

    const browserTabs = await browser.tabs.query({ windowId });
    workspace.tabs = browserTabs.map(WorkspaceTab.from);
    await $lsset({ _workspaceWindows });
  }

  // todo 是否可以人工创建一个popup窗口，然后位置设置在屏幕外面，触发focus和选择文件，处理后关闭窗口
  async importData(state: Persist) {
    if (!Array.isArray(state.workspaces) || state.workspaces.some((w) => !isValidWorkspace(w))) {
      logger.error('data.workspaceses must be Workspace[]', state);
      return;
    }
  }
}
