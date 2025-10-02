import 'rollup-plugin-func-macro';
import { RandomNameLanguage, Theme } from './lib/consts.ts';
import { WorkspaceTab } from './lib/workspace-tab.ts';
import type I18NEnMessage from '../_locales/en/messages.json';
import type I18NZhMessage from '../_locales/zh_CN/messages.json';

declare global {
  const __IS_DEV__: boolean;

  type IsSameType<A, B> =
    (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

  type I18NEnKey = keyof typeof I18NEnMessage;
  type I18NZhKey = keyof typeof I18NZhMessage;
  type I18NKey = I18NEnKey & I18NZhKey;

  type AnyFn = (...args: any[]) => any;

  type HTMLTag = keyof HTMLElementTagNameMap;

  type HexColor = `#${string}`;

  /**
   * Plain Object of workspace
   */
  interface WorkspacePlain {
    id: string;
    name: string;
    color: HexColor;
    tabs: WorkspaceTab[];
    createdAt: number;
    lastOpened: number;
  }

  interface WorkspaceTabPlain {
    id: number; // OnCreated
    index: number; // OnCreated
    title: string; // OnCreated
    url: string; // OnUpdated, changeInfo.url
    pinned: boolean; // OnCreated
  }

  interface WorkspaceFormData {
    id: string | null;
    name: string;
    color: HexColor;
    tabs: WorkspaceTab[];
  }

  interface WorkspaceSettings {
    randomNameLanguage: RandomNameLanguage;
    theme: Theme;
  }

  interface WorkspacePersistant {
    workspaces: WorkspacePlain[];
    settings: WorkspaceSettings;
  }

  interface WorkspaceState extends WorkspacePersistant {
    /**
     * windowId -> workspaceId
     *
     * ## Use `Record` instead of `Map` because
     * Maps are not serializable and cannot be stored in `browser.storage`
     */
    activatedMap: Record<number, string>; //
  }

  interface WorkspacePersistantWithHash extends WorkspacePersistant {
    hash: string;
  }

  type WorkspaceStateKey = keyof WorkspaceState;

  interface WorkspaceStats {
    totalTabs: number;
    pinnedTabs: number;
    regularTabs: number;
    lastOpened: number;
    createdAt: number;
    isActive: boolean;
  }

  interface DraggingData {
    tabId: number;
    workspaceId: string;
    tabUrl: string;
  }
}
