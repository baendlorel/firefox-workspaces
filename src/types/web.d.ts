import { WorkspaceTab } from '@/lib/workspace-tab.ts';
import { Workspace } from '@/lib/workspace.ts';

declare global {
  interface ComponentControlsArgs {
    onNewWorkspace: () => void;
    onAddCurrentTab: () => void;
  }

  interface WorkspaceModalArgs {
    onCancel: () => void;
    onSave: (formData: WorkspaceFormData) => void;
    onSelectColor: (color: string) => void;
  }

  interface WorkspaceFormData {
    id: string | null;
    name: string;
    color: HexColor;
    tabs: WorkspaceTab[];
  }

  interface TabArgs {
    onToggleTabPin: (workspaceId: string, tabId: number) => void;
    onRemoveTab: (workspaceId: string, tabId: number) => void;
  }

  type CreateMainPageArgs = WorkspaceModalArgs & ComponentControlsArgs;

  type WorkspaceEditorEventMap = {
    debug: (...args: any[]) => void;

    'render-list': (workspaces: Workspace[], activated: string[]) => void;
    edit: (workspace: Workspace | null, tabs?: browser.tabs.Tab[]) => void;
    open: (workspace: Workspace) => void;
  };
}
