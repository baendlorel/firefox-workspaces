export class WorkspaceTab {
  static from(tab: browser.tabs.Tab): WorkspaceTab {
    return new WorkspaceTab().assign(tab);
  }

  id: number = browser.tabs.TAB_ID_NONE;
  index: number = NaN;
  title: string = '';
  url: string = '';
  favIconUrl: string = '';
  pinned: boolean = false;
  windowId: number = browser.windows.WINDOW_ID_NONE;

  assign(tab: browser.tabs.Tab): this {
    const keys = Object.keys(this) as (keyof this)[];
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      this[k] = (tab as any)[k] ?? this[k];
    }
    return this;
  }
}
