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

    // workspaces
    'set-current': (workspace?: Workspace) => void;
    'toggle-li-activated': (activated: string[]) => void;
    'render-list': () => void;
    edit: (workspace: Workspace | null, tabs?: browser.tabs.Tab[]) => void;
    delete: (workspace: Workspace) => void;
    open: (workspace: Workspace) => void;
  };
}
