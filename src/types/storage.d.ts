// # storage
interface Persist {
  timestamp: number;
  workspaces: Workspace[];
  settings: Settings;
}

interface State {
  _workspaceWindows: Record<string, number>;
  _windowTabs: Record<number, browser.tabs.Tab[]>;
}

type Local = Persist & State;

type LocalKey = keyof Local;

interface ExportData extends Persist {
  hash: string;
}

type PartialLocal<T extends LocalKey[]> = {
  [K in T[number]]: Local[K];
} & { timestamp: number };
