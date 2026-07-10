import { i } from './lib/polyfilled-api.js';

import { store } from './lib/storage.js';
import { tryUntil } from './lib/try-until.js';
import { isValidSettings } from './lib/settings.js';
import { createWorkspaceTab, isValidWorkspace } from './lib/workspace.js';

export class WorkspaceManager {
  /**
   * Capture tabs from the current window
   */
  async captureCurrentTabs(): Promise<WorkspaceTab[]> {
    const currentWindow = await browser.windows.getCurrent();
    const browserTabs = await browser.tabs.query({ windowId: currentWindow.id });
    return browserTabs
      .filter((tab) => Number.isSafeInteger(tab.id) && tab.id !== browser.tabs.TAB_ID_NONE)
      .map(createWorkspaceTab);
  }

  /**
   * Update tabs for a specific workspace
   */
  async updateWorkspaceTabs(id: string, tabs: WorkspaceTab[]) {
    const { workspaces } = await store.localGet('workspaces');
    const index = workspaces.findIndex((w) => w.id === id);
    if (index === -1) {
      logger.error('Workspace not found:', id);
      return;
    }
    workspaces[index].tabs = tabs;
    await store.localPersistSet({ workspaces });
  }

  async save(workspace: Workspace) {
    const { workspaces } = await store.localGet('workspaces');
    const index = workspaces.findIndex((w) => w.id === workspace.id);
    workspaces[index === -1 ? workspaces.length : index] = workspace;
    await store.localPersistSet({ workspaces });
  }

  // Open workspace in new window
  async open(workspace: Workspace): Promise<{ id: number }> {
    const tabs = [...workspace.tabs].sort((a, b) => a.index - b.index);
    if (tabs.length === 0) {
      const window = await browser.windows.create({ url: 'about:blank', type: 'normal' }) as WindowWithId;
      return { id: window.id };
    }

    // Create new window with first URL
    const window = (await browser.windows
      .create({ url: tabs[0].url, type: 'normal' })
      .catch((e) => (logger.error(e), browser.windows.create({ url: 'about:blank', type: 'normal' }) as Promise<WindowWithId>))) as WindowWithId;

    const waitToMuchTime = await this.waitForWindowReady(window);
    if (waitToMuchTime) {
      logger.warn('Window is not ready in time, some tabs may be missing');
    }

    // Collect tab IDs that need to be pinned
    const tabIdsToPIn: number[] = [];

    // Get the first tab's ID and check if it should be pinned
    const firstTab = (await browser.tabs.query({ windowId: window.id }))[0];
    if (firstTab?.id !== undefined) {
      tabs[0].id = firstTab.id; // update id
      if (tabs[0].pinned) {
        tabIdsToPIn.push(firstTab.id);
      }
    }

    // Open remaining URLs as tabs and collect IDs for pinning
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

      tabs[i].id = tab.id; // update id

      // If this tab should be pinned, record its ID
      if (tabs[i].pinned) {
        tabIdsToPIn.push(tab.id);
      }
    }

    // After all tabs are created, start pin tasks for tabs that need to be pinned
    for (const tabId of tabIdsToPIn) {
      this.tryPinTab(tabId);
    }

    return { id: window.id };
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
   * Try to pin a tab using tryUntil helper
   * Retry until the tab is successfully pinned
   */
  private async tryPinTab(tabId: number) {
    // Use tryUntil to verify the tab is pinned
    const result = await tryUntil(
      () => {
        logger.verbose('trying to pin tab', tabId);
        return browser.tabs.update(tabId, { pinned: true });
      },
      (tab) => tab?.pinned === true,
      0.2, // Check every 0.2 seconds
      6 // Try 6 times (1.2 seconds total)
    );

    if (result?.pinned) {
      logger.info('Tab successfully pinned:', tabId);
    } else {
      logger.warn('Failed to pin tab after retries:', tabId);
    }
  }

  async importData(data: ExportData): Promise<ImportResponse> {
    // 1. Validate structure
    const { workspaces, settings, timestamp } = data;
    logger.info(`Importing with timestamp:${timestamp}, amount: ${workspaces.length}`);

    // 2. Validate workspaces
    if (!Array.isArray(workspaces)) {
      logger.error('data.workspaces must be an array', workspaces);
      return {
        succ: false,
        message: i('message.import.invalid-workspaces'),
        addedCount: 0,
      };
    }
    if (workspaces.some((w) => !isValidWorkspace(w))) {
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

    const summary = i('message.import.summary', added);
    const skippedMessage = skipped === 0 ? '' : i('message.import.summary-skipped', skipped);

    return {
      succ: true,
      message: summary + skippedMessage,
      addedCount: newWorkspaces.length,
    };
  }
}
