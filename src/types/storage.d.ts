// # storage
interface Persist {
  timestamp: number;
  workspaces: Workspace[];
  settings: Settings;
}

type Local = Persist;

type LocalKey = keyof Local;

type ExportData = Persist;

type PartialLocal<T extends LocalKey[]> = {
  [K in T[number]]: Local[K];
} & { timestamp: number };
