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

type CreateMainPageArgs = WorkspaceModalArgs & ComponentControlsArgs;
