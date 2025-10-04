import './lib/promise-ext.js';
import { Color } from './lib/color.js';
import { Sym } from './lib/consts.js';
import { $aboutBlank, $lget, $lpset, $lsset } from './lib/ext-apis.js';
import { $sleep } from './lib/utils.js';
import { createWorkspaceTab, isValidWorkspace } from './lib/workspace.js';

export class WorkspaceManager {
  /**
   * Get the cached tabs of a window and transform to `WorkspaceTab[]`
   */
  async getWindowTabs(windowId: number): Promise<WorkspaceTabPlain[]> {
    const { _windowTabs } = await $lget('_windowTabs');
    const browserTabs = _windowTabs[windowId];
    if (!browserTabs) {
      logger.error('No tabs found for windowId', windowId);
      return [];
    }
    return browserTabs.map(createWorkspaceTab);
  }

  async addWindowTab(browserTab: browser.tabs.Tab) {
    const { _workspaceWindows, _windowTabs } = await $lget('_workspaceWindows', '_windowTabs');
    const windowId = browserTab.windowId;
    if (windowId === undefined) {
      return;
    }
    const workspaceId = _workspaceWindows[windowId];
    if (workspaceId === undefined) {
      return;
    }

    const rawTabs = _windowTabs[windowId];
    if (rawTabs) {
      rawTabs.push(browserTab);
    } else {
      _windowTabs[windowId] = [browserTab];
    }
    await $lsset({ _windowTabs });
  }

  async refreshWindowTab(windowId: number | undefined) {
    const { _workspaceWindows, _windowTabs } = await $lget('_workspaceWindows', '_windowTabs');
    const entry = Object.entries(_workspaceWindows).find(([, wid]) => wid === windowId);
    if (!entry) {
      return;
    }

    const tabs = await browser.tabs.query({ windowId });
    _windowTabs[windowId as number] = tabs;
    await $lsset({ _windowTabs });
  }

  /**
   * Remove the pair of `workspaceToWindow` in store
   */
  async deactivate(id: string) {
    const { _workspaceWindows } = await $lget('_workspaceWindows');
    delete _workspaceWindows[id];
    await $lsset({ _workspaceWindows });
  }

  async save(workspace: Workspace) {
    const { workspaces } = await $lget('workspaces');
    const index = workspaces.findIndex((w) => w.id === workspace.id);
    workspaces[index === -1 ? workspaces.length : index] = workspace;
    await $lpset({ workspaces });
  }

  // Open workspace in new window
  async open(workspace: Workspace): Promise<{ id: number }> {
    // If group already has an active window, focus it
    const { _workspaceWindows } = await $lget('_workspaceWindows');

    // & closed window will be deleted by `this.deactivate`, so windowId found here must be valid
    const windowId = _workspaceWindows[workspace.id];
    if (windowId) {
      // Check if window still exists
      const result = await browser.windows.update(windowId, { focused: true }).catch(() => null);
      if (result === null) {
        logger.error('__func__: Window update failed');
        return { id: browser.windows.WINDOW_ID_NONE };
      }
      return { id: windowId };
    }

    const tabs = [...workspace.tabs].sort((a, b) => a.index - b.index);
    if (tabs.length === 0) {
      const window = await $aboutBlank();
      return await this.openIniter(workspace, window, _workspaceWindows);
    }

    // Create new window with first URL
    const window = (await browser.windows
      .create({ url: tabs[0].url, type: 'normal' })
      .catch((e) => (logger.error(e), $aboutBlank()))) as WindowWithId;

    await this.waitForWindowReady(window);

    // Open remaining URLs as tabs
    for (let i = 1; i < tabs.length; i++) {
      const tab = await browser.tabs
        .create({ windowId: window.id, url: tabs[i].url, index: tabs[i].index })
        .catch((e) => e);

      if (!tab || tab.id === undefined) {
        logger.error('Tab creation failed, skipping to next', tab);
        continue;
      }
    }

    return await this.openIniter(workspace, window, _workspaceWindows);
  }

  private waitForWindowReady(window: WindowWithId) {
    return new Promise<void>((resolve) => {
      const checker = async (
        _tabId: number,
        _changeInfo: browser.tabs._OnUpdatedChangeInfo,
        tab: browser.tabs.Tab
      ) => {
        if (tab && tab.windowId === window.id) {
          resolve();
          browser.tabs.onUpdated.removeListener(checker);
        }
      };
      browser.tabs.onUpdated.addListener(checker);
    });
  }

  /**
   * init function used only in `this.open`
   */
  private async openIniter(
    workspace: Workspace,
    window: WindowWithId,
    _workspaceWindows: State['_workspaceWindows']
  ) {
    this.setBadge(workspace, window.id);
    _workspaceWindows[workspace.id] = window.id;
    await $lsset({ _workspaceWindows });
    return { id: window.id };
  }

  private setBadge(workspace: Workspace, windowId: number) {
    const name = workspace.name;
    const spaceIndex = name.indexOf(' ');
    const short = spaceIndex === -1 ? name.slice(0, 2) : name[0] + name[spaceIndex + 1];

    const color = Color.from(workspace.color).brightness < 128 ? '#F8F9FA' : '#212729';
    browser.action.setBadgeTextColor({ color, windowId });
    browser.action.setBadgeBackgroundColor({ color: workspace.color, windowId });
    browser.action.setBadgeText({ text: short, windowId });
  }

  // todo 是否可以人工创建一个popup窗口，然后位置设置在屏幕外面，触发focus和选择文件，处理后关闭窗口
  async importData(state: Persist) {
    if (!Array.isArray(state.workspaces) || state.workspaces.some((w) => !isValidWorkspace(w))) {
      logger.error('data.workspaceses must be Workspace[]', state);
      return;
    }
  }
}
