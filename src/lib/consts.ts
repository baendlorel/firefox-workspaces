export const enum Consts {
  StorageKey = 'kasukabe_tsumugi:workspaces',
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

export const enum RandomNameLanguage {
  Auto = 'auto',
  Zh = 'zh',
  En = 'en',
}

export const enum Action {
  GetState,
  Get,
  Open,
  GetStats,
  CheckPageInWorkspaces,
  Import,
}

// Prefix parts for randomly generated workspace names. Single-word, capitalized.
export const RANDOM_NAME_EN_A = [
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
export const RANDOM_NAME_EN_B = [
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

// Prefix parts for randomly generated workspace names. Single-word, capitalized.
export const RANDOM_NAME_ZH_A = [
  '赤焰',
  '碧蓝',
  '金辉',
  '银月',
  '翠影',
  '午夜',
  '静谧',
  '隐秘',
  '明亮',
  '流浪',
  '孤独',
  '疾风',
  '安静',
  '勇敢',
];

// Suffix parts for randomly generated workspace names. Single-word, capitalized.
export const RANDOM_NAME_ZH_B = [
  '港湾',
  '避风港',
  '绿洲',
  '圣地',
  '宝库',
  '花园',
  '树林',
  '码头',
  '车站',
  '传送门',
  '枢纽',
  '熔炉',
  '连接点',
  '领域',
];

export class Sym extends null {
  static readonly Reject = Symbol('Reject');
  static readonly NotProvided = Symbol('NotProvided') as any;
  static readonly InjectionFlag = Symbol('KasukabeWorkspace');
}
