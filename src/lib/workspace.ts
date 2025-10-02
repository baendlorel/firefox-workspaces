import { Sym } from './consts.js';
import { $genId } from './utils.js';
import { WorkspaceTab } from './workspace-tab.js';

export class Workspace {
  id: string;
  name: string;
  color: HexColor;
  tabs: WorkspaceTab[];
  createdAt: number;
  lastOpened: number;
  windowId?: number;

  constructor(raw: WorkspaceFormData) {
    this.id = $genId();
    this.name = raw.name;
    this.color = raw.color;
    this.tabs = raw.tabs;
    this.createdAt = Date.now();
    this.lastOpened = 0;
    this.windowId = undefined;
  }

  static from(raw: WorkspaceFormData): Workspace {
    return new Workspace(raw);
  }

  get pinnedTabs(): WorkspaceTab[] {
    return this.tabs.filter((tab) => tab.pinned);
  }

  setWindowId(windowId: number = Sym.NotProvided) {
    this.updateLastOpened();
    if (windowId !== Sym.NotProvided) {
      this.windowId = windowId;
    }
  }

  updateLastOpened() {
    this.lastOpened = Date.now();
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
    workspace.windowId = data.windowId;
    return workspace;
  }

  index: number;
  constructor(index: number, raw: WorkspaceFormData) {
    super(raw);
    this.index = index;
  }
}
