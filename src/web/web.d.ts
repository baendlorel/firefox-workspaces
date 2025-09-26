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

// fixme 这个和Record<string, AnyFn>不兼容，但是下面的type是兼容的
interface W {
  'render-tab': (workspace: Workspace) => HTMLDivElement[];
  'new-workspace': () => void;
  'add-current-tab': () => void;
  'edit-workspace': (workspace: Workspace) => void;
  'delete-workspace': (workspaceId: string) => void;
  'open-workspace': (workspaceId: string) => void;
  'toggle-workspace': (workspaceId: string) => void;
  'remove-tab': (workspaceId: string, tabId: number) => void;
  'toggle-tab-pin': (workspaceId: string, tabId: number) => void;
}

type WorkspaceEventMap = {
  'render-tab': (workspace: Workspace) => HTMLDivElement[];
  'new-workspace': () => void;
  'add-current-tab': () => void;
  'edit-workspace': (workspace: Workspace) => void;
  'delete-workspace': (workspaceId: string) => void;
  'open-workspace': (workspaceId: string) => void;
  'toggle-workspace': (workspaceId: string) => void;
  'remove-tab': (workspaceId: string, tabId: number) => void;
  'toggle-tab-pin': (workspaceId: string, tabId: number) => void;
};
