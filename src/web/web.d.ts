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
  name: string;
  color: HexColor;
}

interface TabArgs {
  onToggleTabPin: (workspaceId: string, tabId: number) => void;
  onRemoveTab: (workspaceId: string, tabId: number) => void;
}

type CreateMainPageArgs = WorkspaceModalArgs & ComponentControlsArgs;

type WorkspaceEventMap = {
  // workspaces
  'render-list': (workspace: Workspace[]) => void;
  'edit-workspace': (workspace: Workspace | null) => void;
  'delete-workspace': (workspace: Workspace) => void;
  'open-workspace': (workspace: Workspace) => void;

  // tabs
  'add-current-tab': () => void;
  'render-tab': (workspace: Workspace) => HTMLDivElement[];
  'move-tab': (fromId: string, toId: string, tabId: number) => void;
  'remove-tab': (workspaceId: string, tabId: number) => void;
  'toggle-tab-pin': (workspaceId: string, tabId: number) => void;

  // form
  'select-color': (color: HexColor) => void;
  'close-modal': () => void;
  'modal-cancel': () => void;
  'save-workspace': (formData: WorkspaceFormData) => void;
};
