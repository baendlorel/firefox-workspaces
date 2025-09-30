export class TabContainer {
  // # tab containers
  /**
   * Stores window id to tab, when window is closed we can quickly find all tabs to save
   */
  private readonly map = new Map<number, Map<number, browser.tabs.Tab>>();

  /**
   * Temporarily insert/update a tab in the internal tracking map
   */
  save(tab: browser.tabs.Tab) {
    const tabId = tab.id;
    const windowId = tab.windowId;
    if (tabId === undefined || windowId === undefined) {
      logger.warn('Tab or window id is undefined, cannot track tab:', tab);
      return;
    }

    const subMap = this.map.get(windowId);
    if (subMap) {
      subMap.set(tabId, tab);
      return;
    }

    const newSubMap = new Map<number, browser.tabs.Tab>();
    newSubMap.set(tabId, tab);
    this.map.set(windowId, newSubMap);
  }

  get(windowId: number): Map<number, browser.tabs.Tab> | undefined {
    return this.map.get(windowId);
  }
}
