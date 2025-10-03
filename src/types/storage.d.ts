// # storage
interface Persist {
  timestamp: number;
  workspaces: Workspace[];
  settings: Settings;
}

interface State {
  /**
   * A flat pair array of windowId -> workspaceId
   * @see https://www.npmjs.com/package/flat-pair
   */
  _workspaceWindows: (string | number)[];

  /**
   * A flat pair array of windowId -> browser.tabs.Tab[]
   * @see https://www.npmjs.com/package/flat-pair
   */
  _windowTabs: (number | browser.tabs.Tab[])[];
}

type Local = Persist & State;

type LocalKey = keyof Local;

interface ExportData extends Persist {
  hash: string;
}

type PartialLocal<T extends LocalKey[]> = {
  [K in T[number]]: Local[K];
};
