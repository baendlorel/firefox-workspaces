import 'rollup-plugin-func-macro';
import type I18NEnMessage from '../_locales/en/messages.json';
import type I18NZhMessage from '../_locales/zh_CN/messages.json';

declare global {
  const __IS_DEV__: boolean;

  // # types
  type I18NEnKey = keyof typeof I18NEnMessage;
  type I18NZhKey = keyof typeof I18NZhMessage;
  type I18NKey = I18NEnKey & I18NZhKey;

  type AnyFn = (...args: any[]) => any;

  type HTMLTag = keyof HTMLElementTagNameMap;

  type HexColor = `#${string}`;

  /**
   * Plain Object of workspace
   */
  interface Workspace {
    id: string;
    name: string;
    color: HexColor;
    tabs: WorkspaceTab[];
    createdAt: number;
    lastOpened: number;

    // # Password protection fields
    /**
     * SHA-256 hash of the password
     * - empty string = no password
     */
    password: string;

    /**
     * First 3 characters of the password
     * - empty string = no hint
     */
    passpeek: string;

    /**
     * Number of consecutive failed login attempts
     * - `NaN` = none
     */
    failedAttempts: number;

    /**
     * Timestamp when the workspace can be unlocked again
     * - `NaN` = not locked
     */
    lockUntil: number;
  }

  interface WorkspaceTab {
    id: number; // OnCreated
    index: number; // OnCreated
    title: string; // OnCreated
    url: string; // OnUpdated, changeInfo.url
    pinned: boolean; // * no longer use this. OnCreated
  }

  interface WorkspaceFormData {
    id: string | null;
    name: string;
    color: HexColor;
    tabs: WorkspaceTab[];

    /**
     * SHA-256 hash, empty string = no password
     */
    password: string; //

    /**
     * First 3 chars of password
     */
    passpeek: string;
  }

  interface Settings {
    theme: Theme;
    // Whether to sync data via browser.storage.sync
    sync: Switch;
  }

  type WindowWithId = browser.windows.Window & { id: number };
}
