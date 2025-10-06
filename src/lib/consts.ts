declare global {
  const enum Consts {
    InjectionFlag = 'kasukabe_tsumugi:workspaces',
    DefaultColor = '#2da191',
  }

  const enum PopupPage {
    Donate = 'donate',
    About = 'about',
    Import = 'import',
  }

  const enum Action {
    /**
     * Open workspace in a new window
     */
    Open,

    /**
     * Toggle data synchronize
     */
    ToggleSync,

    /**
     * Need this because tabs info can only be accessed in background script
     */
    Export,

    /**
     * The import file page sends data to background
     */
    ReturnFileData,

    /**
     * Used to open about and donate page
     */
    OpenPage,
  }

  const enum Switch {
    On = 'on',
    Off = 'off',
  }

  const enum Theme {
    Auto = 'auto',
    Light = 'light',
    Dark = 'dark',
  }

  const enum SyncState {
    Syncing,
    Success,
    Error,
  }
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
