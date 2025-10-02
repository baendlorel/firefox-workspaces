const keys: (keyof WorkspaceTabPlain)[] = ['id', 'index', 'title', 'url', 'pinned', 'windowId'];

export class WorkspaceTab implements WorkspaceTabPlain {
  static from(tab: browser.tabs.Tab): WorkspaceTab {
    return new WorkspaceTab().assign(tab);
  }

  static hasRelatedChange(changeInfo: any) {
    return keys.some((k) => k in changeInfo);
  }

  id: number = browser.tabs.TAB_ID_NONE; // OnCreated
  index: number = NaN; // OnCreated
  title: string = ''; // OnCreated
  url: string = ''; // OnUpdated, changeInfo.url
  pinned: boolean = false; // OnCreated
  windowId: number = browser.windows.WINDOW_ID_NONE; // OnCreated

  assign(tab: browser.tabs.Tab): this {
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      (this as any)[k] = (tab as any)[k] ?? this[k];
    }
    return this;
  }

  update(changeInfo: any): this {
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (k in changeInfo) {
        (this as any)[k] = changeInfo[k] ?? this[k];
      }
    }
    return this;
  }
}
