// # storage
interface Local {
  workspaces: Workspace[];

  settings: Settings;

  /**
   * A flat pair array of windowId -> workspaceId
   * @see https://www.npmjs.com/package/flat-pair
   */
  _workspaceWindow: (string | number)[];
}

type Persist = PickNonUnderscore<Local>;
type State = PickUnderscore<Local>;

type LocalKey = keyof Local;
type PersistKey = keyof Persist;
type StateKey = keyof State; // StripUnderscoreKeys<State>;

interface ExportData extends Persist {
  hash: string;
}

type PartialLocal<T extends LocalKey[]> = {
  [K in T[number]]: Local[K];
};

type PartialPersist<T extends PersistKey[]> = {
  [K in T[number]]: Persist[K];
};

type PartialState<T extends StateKey[]> = {
  [K in T[number]]: State[K];
};
