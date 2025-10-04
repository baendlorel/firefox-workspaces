import { Color } from './color.js';
import { $genId } from './utils.js';
import { WorkspaceTab } from './workspace-tab.js';

export const createWorkspace = (formData: WorkspaceFormData): Workspace => ({
  id: $genId(),
  name: formData.name,
  color: formData.color,
  tabs: formData.tabs,
  createdAt: Date.now(),
  lastOpened: 0,
});

export const isValidWorkspace = (o: Workspace) => {
  if (typeof o !== 'object' || o === null) {
    return false;
  }

  // & ignores createdAt and lastOpened, since they are not necessary
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    Color.valid(o.color) &&
    Array.isArray(o.tabs) &&
    o.tabs.every(WorkspaceTab.valid)
  );
};

export const isValidWorkspaces = (o: Workspace[]): o is Workspace[] => {
  return Array.isArray(o) && o.every((w) => isValidWorkspace(w));
};
