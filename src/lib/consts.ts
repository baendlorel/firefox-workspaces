export const enum Consts {
  StorageKey = 'kasukabe_tsumugi:workspaces',
  InjectionFlag = 'kasukabe_tsumugi_workspaces_content_loaded',
  DefaultColor = '#2da191',
}

export const WORKSPACE_COLORS: HexColor[] = [
  '#00b7c3',
  '#0078d4',
  '#0d546a',
  '#107c10',
  '#498205',
  '#8661c5',
  '#881798',
  '#b4009e',
  '#c90919',
  '#ff8c00',
  '#c84f39',
  '#505050',
  '#212529',
  '#004e8c',
];

export const enum OnUpdatedChangeInfoStatus {
  Complete = 'complete',
  Loading = 'loading',
}
export const enum Theme {
  Auto = 'auto',
  Light = 'light',
  Dark = 'dark',
}

export const enum Action {
  Get = 'Get',
  Create = 'Create',
  Update = 'Update',
  Delete = 'Delete',
  Open = 'Open',
  MoveTab = 'MoveTab',
  GetStats = 'GetStats',
  CheckPageInWorkspaces = 'CheckPageInWorkspaces',
  WindowFocusChanged = 'WindowFocusChanged',
  Export = 'Export',
  Import = 'Import',
}

// Prefix parts for randomly generated workspace names. Single-word, capitalized.
export const RANDOM_NAME_PART1 = [
  'Crimson',
  'Azure',
  'Golden',
  'Silver',
  'Emerald',
  'Midnight',
  'Silent',
  'Hidden',
  'Bright',
  'Wandering',
  'Lonely',
  'Rapid',
  'Calm',
  'Bold',
];

// Suffix parts for randomly generated workspace names. Single-word, capitalized.
export const RANDOM_NAME_PART2 = [
  'Haven',
  'Harbor',
  'Oasis',
  'Sanctum',
  'Vault',
  'Garden',
  'Grove',
  'Pier',
  'Station',
  'Portal',
  'Hub',
  'Forge',
  'Nexus',
  'Realm',
];

export class Sym extends null {
  static readonly Reject = Symbol('Reject');
  static readonly NotProvided = Symbol('NotProvided') as any;
}
