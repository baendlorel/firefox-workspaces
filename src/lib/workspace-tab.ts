export class WorkspaceTab {
  static from(tab: browser.tabs.Tab): WorkspaceTab {
    const wt = new WorkspaceTab();
    wt.assign(wt, tab);
    return wt;
  }

  id: number = browser.tabs.TAB_ID_NONE;
  title: string = '';
  url: string = '';
  favIconUrl: string = '';
  pinned: boolean = false;
  windowId: number = browser.windows.WINDOW_ID_NONE;

  assign(workspaceTab: WorkspaceTab, tab: browser.tabs.Tab) {
    workspaceTab.id = tab.id ?? workspaceTab.id;
    workspaceTab.url = tab.url ?? workspaceTab.url;
    workspaceTab.title = tab.title ?? workspaceTab.title;
    workspaceTab.favIconUrl = tab.favIconUrl ?? workspaceTab.favIconUrl;
    workspaceTab.pinned = tab.pinned;
  }
}
