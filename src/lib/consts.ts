declare global {
  const enum Consts {
    InjectionFlag = 'kasukabe_tsumugi:workspaces',

    PolyfillFlag = 'kasukabe_tsumugi:browser-polyfill',

    DefaultColor = '#2da191',

    /**
     * Synchronize in 05,10,15... each hour
     */
    SyncInterval = 5,
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
    Syncing = 'syncing',
    Success = 'success',
    Error = 'error',
  }
}

export const WORKSPACE_COLORS: HexColor[] = [
  '#00b7c3ff',
  '#0078d4ff',
  '#0d546aff',
  '#107c10ff',
  '#498205ff',
  '#8661c5ff',
  '#881798ff',
  '#b4009eff',
  '#c90919ff',
  '#ff8c00ff',
  '#c84f39ff',
  '#505050ff',
  '#212529ff',
  '#004e8cff',
];

export const NotProvided = Symbol('NotProvided') as any;
