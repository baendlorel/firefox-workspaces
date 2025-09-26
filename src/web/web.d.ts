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
  color: string;
}

interface TabArgs {
  onToggleTabPin: (workspaceId: string, tabId: number) => void;
  onRemoveTab: (workspaceId: string, tabId: number) => void;
}

type CreateMainPageArgs = WorkspaceModalArgs & ComponentControlsArgs;

type WorkspaceEventMap = {
  'render-list': (workspace: Workspace[]) => void;
  'render-tab': (workspace: Workspace) => HTMLDivElement[];
  'new-workspace': () => void;
  'add-current-tab': () => void;
  'edit-workspace': (workspace: Workspace) => void;
  'delete-workspace': (workspaceId: string) => void;
  'open-workspace': (workspaceId: string) => void;
  'toggle-workspace': (workspaceId: string) => void;
  'remove-tab': (workspaceId: string, tabId: number) => void;
  'toggle-tab-pin': (workspaceId: string, tabId: number) => void;

  // form
  'select-color': (color: HexColor) => void;
  'close-modal': () => void;
  'modal-cancel': () => void;
  'modal-save': (formData: WorkspaceFormData) => void;
};
