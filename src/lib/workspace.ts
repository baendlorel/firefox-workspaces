import { Color } from './color.js';
import { $genId } from './utils.js';
import { WorkspaceTab } from './workspace-tab.js';

export const createWorkspacePlain = (formData: WorkspaceFormData): WorkspacePlain => ({
  id: $genId(),
  name: formData.name,
  color: formData.color,
  tabs: formData.tabs,
  createdAt: Date.now(),
  lastOpened: 0,
});

export class Workspace implements WorkspacePlain {
  static valid(o: WorkspacePlain) {
    if (typeof o !== 'object' || o === null) {
      return false;
    }

    // ignores createdAt and lastOpened, since they are not necessary
    return (
      typeof o.id === 'string' &&
      typeof o.name === 'string' &&
      Color.valid(o.color) &&
      Array.isArray(o.tabs) &&
      o.tabs.every(WorkspaceTab.valid)
    );
  }

  static create(raw: WorkspaceFormData): Workspace {
    return new Workspace(raw);
  }

  static from(raw: WorkspaceFormData): Workspace {
    return new Workspace(raw);
  }

  id: string;
  name: string;
  color: HexColor;
  tabs: WorkspaceTab[];
  createdAt: number;
  lastOpened: number;

  constructor(raw: WorkspaceFormData) {
    this.id = $genId();
    this.name = raw.name;
    this.color = raw.color;
    this.tabs = raw.tabs;
    this.createdAt = Date.now();
    this.lastOpened = 0;
  }

  get pinnedTabs(): WorkspaceTab[] {
    return this.tabs.filter((tab) => tab.pinned);
  }
}

/**
 * For quicker access to the workspace data with `_map` and `_arr` in `WorkspaceManager`
 */
export class IndexedWorkspace extends Workspace {
  static load(index: number, data: Workspace) {
    const workspace = new IndexedWorkspace(index, data);
    workspace.id = data.id;
    workspace.name = data.name;
    workspace.color = data.color;
    workspace.tabs = data.tabs; // ?? 这里可能是plainobject而不是真正的WorkspaceTab实例
    workspace.createdAt = data.createdAt;
    workspace.lastOpened = data.lastOpened;
    return workspace;
  }

  index: number;
  constructor(index: number, raw: WorkspaceFormData) {
    super(raw);
    this.index = index;
  }
}
