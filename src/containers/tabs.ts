import { WorkspaceTab } from '@/lib/workspace-tab.js';

export class TabContainer {
  readonly arr: WorkspaceTab[] = [];

  /**
   * Temporarily insert/update a tab in the internal tracking map
   */
  save(browserTab: browser.tabs.Tab) {
    if (browserTab.id === undefined || browserTab.windowId === undefined) {
      logger.warn('tabId and windowId is undefined, browserTab:', browserTab);
      return;
    }

    const exist = this.get(browserTab.id);
    if (exist) {
      exist.assign(browserTab);
      return;
    }

    this.arr.push(WorkspaceTab.from(browserTab));
  }

  hasById(id: number): boolean {
    return this.arr.some((t) => t.id === id);
  }

  delete(tab: WorkspaceTab) {
    const index = this.arr.findIndex((t) => t.id === tab.id);
    if (index !== -1) {
      this.arr.splice(index, 1);
    }
  }

  deleteById(tabId: number) {
    const index = this.arr.findIndex((t) => t.id === tabId);
    if (index !== -1) {
      this.arr.splice(index, 1);
    }
  }

  refreshWindow(windowId: number, tabs: browser.tabs.Tab[]) {
    const filtered = this.arr.filter((t) => t.windowId !== windowId);
    const newTabs = tabs.map((t) => WorkspaceTab.from(t));
    this.arr.length = 0;
    this.arr.push(...filtered, ...newTabs);
  }

  /**
   * Get all tabs of the given windowId
   */
  getTabsOfWindow(windowId: number) {
    return this.arr.filter((t) => t.windowId === windowId);
  }

  get(tabId: number) {
    return this.arr.find((t) => t.id === tabId);
  }

  clear(windowId: number) {
    const filtered = this.arr.filter((t) => t.windowId !== windowId);
    this.arr.length = 0;
    this.arr.push(...filtered);
  }

  clearAll() {
    this.arr.length = 0;
  }

  /**
   * Only do the adding, deleting is handled in `detach`
   * [INFO] Only workspace window will enter this method
   */
  attach(windowId: number, tabId: number) {
    // todo 这一行应该是不需要了
    const targetWindowTabs = this.getTabsOfWindow(windowId);
    if (targetWindowTabs.length === 0) {
      logger.info('Not a workspace window, skip attach. windowId', windowId, 'tabId', tabId);
      return;
    }

    const index = this.arr.findIndex((t) => t.id === tabId);
    if (index === -1) {
      logger.error('TabId not found, cannot attach. windowId', windowId, 'tabId', tabId);
      return;
    }

    this.arr[index].windowId = windowId;
  }

  /**
   * Only do the deleting, adding is handled in `attach`
   * [INFO] Only workspace window will enter this method
   */
  detach(windowId: number, tabId: number) {
    const tab = this.arr.find((t) => t.id === tabId && t.windowId === windowId);
    if (!tab) {
      logger.warn('Tab not found. windowId', windowId, 'tabId', tabId);
      return;
    }
    tab.windowId = browser.windows.WINDOW_ID_NONE;
  }
}
