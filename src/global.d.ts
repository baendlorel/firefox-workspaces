import 'rollup-plugin-func-macro';
import { Workspace } from './lib/workspace.ts';
import { Theme } from './lib/consts.ts';
import { WorkspaceTab } from './lib/workspace-tab.ts';

declare global {
  const __IS_DEV__: boolean;

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
