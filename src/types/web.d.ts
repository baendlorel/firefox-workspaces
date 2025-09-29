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
  id: string | undefined;
  name: string;
  color: HexColor;
}

interface TabArgs {
  onToggleTabPin: (workspaceId: string, tabId: number) => void;
  onRemoveTab: (workspaceId: string, tabId: number) => void;
}

type CreateMainPageArgs = WorkspaceModalArgs & ComponentControlsArgs;

type WorkspaceEditorEventMap = {
  // workspaces
  'set-current': (workspace?: Workspace) => void;
  'render-list': (workspaces: Workspace[], activeWorkspaces?: string[]) => void;
  edit: (workspace: Workspace | null) => void;
  delete: (workspace: Workspace) => void;
  open: (workspace: Workspace) => void;

  // tabs
  'add-current-tab': () => void;
  'render-tab': (workspace: Workspace) => HTMLDivElement[];
  'move-tab': (fromId: string, toId: string, tabId: number) => void;
  'remove-tab': (workspaceId: string, tabId: number) => void;
  'toggle-tab-pin': (workspaceId: string, tabId: number) => void;

  // form
  'close-editor': () => void;
  save: (formData: WorkspaceFormData) => void;
};
