export class TabContainer {
  private readonly map = new Map<number, Map<number, browser.tabs.Tab>>();
  private readonly reverseMap = new Map<number, number>(); // tabId -> windowId

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
    this.reverseMap.set(tabId, windowId);
  }

  delete(tab: browser.tabs.Tab) {
    const tabId = tab.id;
    const windowId = tab.windowId;
    if (tabId === undefined || windowId === undefined) {
      logger.warn('Tab or window id is undefined, cannot delete:', tab);
      return;
    }

    const subMap = this.map.get(windowId);
    if (subMap) {
      subMap.delete(tabId);
    }
    this.reverseMap.delete(tabId);
  }

  /**
   * Get all tabs of the given windowId
   */
  get(windowId: number): Map<number, browser.tabs.Tab> | undefined {
    return this.map.get(windowId);
  }

  getTab(windowId: number, tabId: number): browser.tabs.Tab | undefined {
    return this.map.get(windowId)?.get(tabId);
  }

  clear(windowId: number) {
    this.map.delete(windowId);
  }

  clearAll() {
    this.map.clear();
  }
}
