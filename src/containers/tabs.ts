import { WorkspaceTab } from '@/lib/workspace-tab.js';

export class TabContainer {
  readonly map = new Map<number, Map<number, WorkspaceTab>>();
  readonly idMap = new Map<number, WorkspaceTab>(); // tabId -> tab

  /**
   * Temporarily insert/update a tab in the internal tracking map
   */
  save(browserTab: browser.tabs.Tab) {
    if (browserTab.id === undefined || browserTab.windowId === undefined) {
      logger.warn('Tab or window id is undefined, cannot track tab:', browserTab);
      return;
    }

    const tab = WorkspaceTab.from(browserTab);

    const subMap = this.map.get(tab.windowId);
    if (subMap) {
      subMap.set(tab.id, tab);
      return;
    }

    const newSubMap = new Map<number, WorkspaceTab>();
    newSubMap.set(tab.id, tab);
    this.map.set(tab.windowId, newSubMap);
    this.idMap.set(tab.id, tab);
  }

  delete(tab: WorkspaceTab) {
    const subMap = this.map.get(tab.windowId);
    if (subMap) {
      subMap.delete(tab.id);
    }
    this.idMap.delete(tab.id);
  }

  /**
   * Get all tabs of the given windowId
   */
  get(windowId: number): Map<number, WorkspaceTab> | undefined {
    return this.map.get(windowId);
  }

  getTab(windowId: number, tabId: number): WorkspaceTab | undefined {
    return this.map.get(windowId)?.get(tabId);
  }

  clear(windowId: number) {
    this.map.delete(windowId);
  }

  clearAll() {
    this.map.clear();
  }

  /**
   * Only do the adding, deleting is handled in `detach`
   */
  attach(windowId: number, tabId: number) {
    const tab = this.idMap.get(tabId);
    if (!tab) {
      logger.warn('Tab not found, cannot attach:', windowId, tabId);
      return;
    }

    // & old window and new window might not be a workspace window, so it's optional
    this.map.get(windowId)?.set(tabId, tab);
    tab.windowId = windowId;
  }

  /**
   * Only do the deleting, adding is handled in `attach`
   */
  detach(windowId: number, tabId: number) {
    // maybe not a workspace tab
    const tab = this.idMap.get(tabId);
    if (!tab) {
      return;
    }

    // but if found in idMap, subMap must be valid
    const subMap = this.map.get(windowId);
    if (!subMap) {
      logger.error('WindowId not found, cannot detach:', windowId, tabId);
      return;
    }
    subMap.delete(tabId);
    tab.windowId = browser.windows.WINDOW_ID_NONE;
  }
}
