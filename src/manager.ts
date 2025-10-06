import { i, $aboutBlank, $setBadge } from './lib/polyfilled-api.js';

import { Color } from './lib/color.js';
import { store } from './lib/storage.js';
import { isValidSettings } from './lib/settings.js';
import { $objectHash } from './lib/utils.js';
import { createWorkspaceTab, isValidWorkspace } from './lib/workspace.js';

export class WorkspaceManager {
  /**
   * Get the cached tabs of a window and transform to `WorkspaceTab[]`
   */
  async getWindowTabs(windowId: number): Promise<WorkspaceTab[]> {
    const { _windowTabs } = await store.localGet('_windowTabs');
    const browserTabs = _windowTabs[windowId];
    if (!browserTabs) {
      logger.error('No tabs found for windowId', windowId);
      return [];
    }
    return browserTabs // & ensure that tab.id is valid, or createWorkspaceTab will throw
      .filter((tab) => Number.isSafeInteger(tab.id) && tab.id !== browser.tabs.TAB_ID_NONE)
      .map(createWorkspaceTab);
  }

  async addTabToWindow(browserTab: browser.tabs.Tab) {
    const { _workspaceWindows, _windowTabs } = await store.localGet(
      '_workspaceWindows',
      '_windowTabs'
    );
    const windowId = browserTab.windowId;
    if (windowId === undefined) {
      return;
    }

    const entry = Object.entries(_workspaceWindows).find(([, wid]) => wid === windowId);
    if (!entry) {
      return;
    }

    const rawTabs = _windowTabs[windowId];
    if (rawTabs) {
      rawTabs.push(browserTab);
    } else {
      _windowTabs[windowId] = [browserTab];
    }
    await store.localStateSet({ _windowTabs });
  }

  async refreshWindowTab(windowId: number | undefined) {
    const { _workspaceWindows, _windowTabs } = await store.localGet(
      '_workspaceWindows',
      '_windowTabs'
    );
    const entry = Object.entries(_workspaceWindows).find(([, wid]) => wid === windowId);
    if (!entry) {
      return;
    }

    const tabs = await browser.tabs.query({ windowId });
    _windowTabs[windowId as number] = tabs;
    await store.localStateSet({ _windowTabs });
  }

  async saveAllTab() {
    const { workspaces, _workspaceWindows, _windowTabs } = await store.localGet(
      'workspaces',
      '_workspaceWindows',
      '_windowTabs'
    );
    for (let i = 0; i < workspaces.length; i++) {
      const w = workspaces[i];
      const tabs = _windowTabs[_workspaceWindows[w.id]];
      if (tabs) {
        w.tabs = tabs.map(createWorkspaceTab);
      }
    }

    await store.localPersistSet({ workspaces });
  }

  /**
   * Remove the pair of `workspaceToWindow` in store
   */
  async deactivate(id: string) {
    const { _workspaceWindows } = await store.localGet('_workspaceWindows');
    delete _workspaceWindows[id];
    await store.localStateSet({ _workspaceWindows });
  }

  async save(workspace: Workspace) {
    const { workspaces } = await store.localGet('workspaces');
    const index = workspaces.findIndex((w) => w.id === workspace.id);
    workspaces[index === -1 ? workspaces.length : index] = workspace;
    await store.localPersistSet({ workspaces });
  }

  // Open workspace in new window
  async open(workspace: Workspace): Promise<{ id: number }> {
    // If group already has an active window, focus it
    const { _workspaceWindows } = await store.localGet('_workspaceWindows');

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

    const waitToMuchTime = await this.waitForWindowReady(window);
    if (waitToMuchTime) {
      logger.warn('Window is not ready in time, some tabs may be missing');
    }

    // Open remaining URLs as tabs
    for (let i = 1; i < tabs.length; i++) {
      const tab = await browser.tabs
        .create({
          windowId: window.id,
          url: tabs[i].url,
          index: tabs[i].index,
        })
        .catch((e) => e);

      if (!tab || tab.id === undefined) {
        logger.error('Tab creation failed, skipping to next', tab);
        continue;
      }
    }

    return await this.openIniter(workspace, window, _workspaceWindows);
  }

  private waitForWindowReady(window: WindowWithId, timeout: number = 6000) {
    return new Promise<boolean>((resolve) => {
      const checker = async (
        _tabId: number,
        _changeInfo: browser.tabs._OnUpdatedChangeInfo,
        tab: browser.tabs.Tab
      ) => {
        if (tab && tab.windowId === window.id) {
          resolve(false);
          browser.tabs.onUpdated.removeListener(checker);
        }
      };
      browser.tabs.onUpdated.addListener(checker);
      setTimeout(() => resolve(true), timeout);
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
    await store.localStateSet({ _workspaceWindows });
    return { id: window.id };
  }

  private setBadge(workspace: Workspace, windowId: number) {
    const name = workspace.name;
    const backgroundColor = workspace.color;
    const spaceIndex = name.indexOf(' ');
    const text = spaceIndex === -1 ? name.slice(0, 2) : name[0] + name[spaceIndex + 1];

    const color = Color.from(backgroundColor).brightness < 128 ? '#F8F9FA' : '#212729';
    $setBadge({ text, color, backgroundColor, windowId });
  }

  async importData(data: ExportData): Promise<ImportResponse> {
    // 1. Validate hash
    const { hash, workspaces, settings, timestamp } = data;
    const dataWithoutHash = { workspaces, settings, timestamp };

    const calculatedHash = $objectHash(dataWithoutHash);

    if (hash !== calculatedHash) {
      return {
        succ: false,
        message: i('message.import.invalid-hash'),
        addedCount: 0,
      };
    }

    // 2. Validate workspaces
    if (!Array.isArray(workspaces) || workspaces.some((w) => !isValidWorkspace(w))) {
      return {
        succ: false,
        message: i('message.import.invalid-workspaces'),
        addedCount: 0,
      };
    }

    // 3. Validate settings
    if (!isValidSettings(settings)) {
      return {
        succ: false,
        message: i('message.import.invalid-settings'),
        addedCount: 0,
      };
    }

    // 4. Get current data
    const { workspaces: currentWorkspaces } = await store.localGet('workspaces', 'settings');

    // 5. Merge workspaces (only add new ones, don't overwrite)
    const existingIds = new Set(currentWorkspaces.map((w) => w.id));
    const newWorkspaces = workspaces.filter((w) => !existingIds.has(w.id));
    const mergedWorkspaces = [...currentWorkspaces, ...newWorkspaces];

    // 6. Save merged data
    await store.localPersistSet({ workspaces: mergedWorkspaces, settings });

    const added = newWorkspaces.length;
    const skipped = workspaces.length - newWorkspaces.length;

    const summary = i('message.import.summary', { added });
    const skippedMessage = skipped === 0 ? '' : i('message.import.summary-skipped', { skipped });

    return {
      succ: true,
      message: summary + skippedMessage,
      addedCount: newWorkspaces.length,
    };
  }
}
