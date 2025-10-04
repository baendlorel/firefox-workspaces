import 'rollup-plugin-func-macro';
import { Theme } from './lib/consts.ts';
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
    tabs: WorkspaceTabPlain[];
    createdAt: number;
    lastOpened: number;
  }

  interface WorkspaceTabPlain {
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
    tabs: WorkspaceTabPlain[];
  }

  interface Settings {
    theme: Theme;
  }

  type WindowWithId = browser.windows.Window & { id: number };
}
