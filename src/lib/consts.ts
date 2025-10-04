export const enum Consts {
  InjectionFlag = 'kasukabe_tsumugi:workspaces',
  DefaultColor = '#2da191',
}

export const enum Switch {
  On = 'on',
  Off = 'off',
}

export const enum Theme {
  Auto = 'auto',
  Light = 'light',
  Dark = 'dark',
}

export const enum Action {
  Open,
  ToggleSync,
  Export,
  Import,
  OpenFileInput,
  ReturnFileData,
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

export const NotProvided = Symbol('NotProvided') as any;
