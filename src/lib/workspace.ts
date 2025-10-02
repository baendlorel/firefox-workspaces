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

  constructor(name: string, color: HexColor) {
    this.id = $genId();
    this.name = name;
    this.color = color;
    this.tabs = [];
    this.createdAt = Date.now();
    this.lastOpened = 0;
    this.windowId = undefined;
  }

  static from(name: string, color: HexColor, tabs: browser.tabs.Tab[] = []): Workspace {
    const workspace = new Workspace(name, color);
    workspace.tabs = tabs.map(tab => WorkspaceTab.from(tab));
    return workspace;
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
    const workspace = new IndexedWorkspace(index, data.name, data.color);
    workspace.id = data.id;
    workspace.name = data.name;
    workspace.color = data.color;
    workspace.tabs = data.tabs;
    workspace.createdAt = data.createdAt;
    workspace.lastOpened = data.lastOpened;
    workspace.windowId = data.windowId;
    return workspace;
  }

  index: number;
  constructor(index: number, name: string, color: HexColor) {
    super(name, color);
    this.index = index;
  }
}
