export const enum Consts {
  StorageKey = 'kasukabe_tsumugi:workspaces',
  InjectionFlag = 'kasukabe_tsumugi_workspaces_content_loaded',
  DefaultColor = '#2da191',
}

export const WORKSPACE_COLORS: HexColor[] = [
  '#212529',
  '#f8f9fa',
  '#0d546a',
  '#2da191',
  '#43e97b',
  '#84cc16',
  '#a8edea',
  '#098cff',
  '#007acc',
  '#667eea',
  '#8b5cf6',
  '#f093fb',
  '#ffecd2',
  '#ffc107',
  '#ffa726',
  '#fa709a',
  '#ff6b35',
  '#e32649',
];

export const enum OnUpdatedChangeInfoStatus {
  Complete = 'complete',
  Loading = 'loading',
}

export const enum Action {
  GetWorkspaces = 'GetWorkspaces',
  CreateWorkspace = 'CreateWorkspace',
  UpdateWorkspace = 'UpdateWorkspace',
  DeleteWorkspace = 'DeleteWorkspace',
  RemoveTab = 'RemoveTab',
  TogglePin = 'TogglePin',
  OpenWorkspace = 'OpenWorkspace',
  MoveTab = 'MoveTab',
  GetStats = 'GetStats',
  CheckPageInWorkspaces = 'CheckPageInWorkspaces',
  WindowFocusChanged = 'WindowFocusChanged',
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
