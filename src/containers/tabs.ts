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

  clearAll() {
    this.arr.length = 0;
  }
}
