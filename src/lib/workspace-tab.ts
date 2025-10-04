export const createWorkspaceTab = (tab: browser.tabs.Tab): WorkspaceTabPlain => {
  if (tab.id === undefined || tab.id === browser.tabs.TAB_ID_NONE) {
    throw new TypeError('WorkspaceTab: browserTab.id is undefined or TAB_ID_NONE');
  }
  return {
    id: tab.id,
    index: tab.index,
    title: tab.title ?? '',
    url: tab.url ?? '',
    pinned: tab.pinned ?? false,
  };
};

export const isValidWorkspaceTab = (o: any): o is WorkspaceTabPlain => {
  return (
    Number.isSafeInteger(o.id) &&
    o.id >= 0 &&
    Number.isSafeInteger(o.index) &&
    o.index >= 0 &&
    typeof o.url === 'string' &&
    typeof o.title === 'string' &&
    typeof o.pinned === 'boolean'
  );
};
