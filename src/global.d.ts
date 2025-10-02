import 'rollup-plugin-func-macro';
import { Workspace } from './lib/workspace.ts';
import { Theme } from './lib/consts.ts';
import { WorkspaceTab } from './lib/workspace-tab.ts';
import type I18NEnMessage from '../_locales/en/messages.json';
import type I18NZhMessage from '../_locales/en/messages.json';

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

  interface WorkspaceFormData {
    id: string | null;
    name: string;
    color: HexColor;
    tabs: WorkspaceTab[];
  }

  interface WorkspaceSettings {
    theme: Theme;
  }

  interface WorkspaceStoredData {
    list: Workspace[];
  }

  interface WorkspaceStats {
    totalTabs: number;
    pinnedTabs: number;
    regularTabs: number;
    lastOpened: number;
    createdAt: number;
    isActive: boolean;
  }

  interface ExportData {
    version: string;
    exportDate: number;
    workspaceses: Workspace[];
  }

  interface DraggingData {
    tabId: number;
    workspaceId: string;
    tabUrl: string;
  }
}
