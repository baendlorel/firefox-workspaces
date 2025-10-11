// # storage
interface Persist {
  timestamp: number;
  workspaces: Workspace[];
  settings: Settings;
}

interface State {
  // workspaceId -> windowId
  _workspaceWindows: Record<string, number>;
  // windowId -> browser.tabs.Tab[]
  _windowTabs: Record<number, browser.tabs.Tab[]>;
}

type Local = Persist & State;

type LocalKey = keyof Local;

type ExportData = Persist;

type PartialLocal<T extends LocalKey[]> = {
  [K in T[number]]: Local[K];
} & { timestamp: number };
