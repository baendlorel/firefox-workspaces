import { IndexedWorkspace } from '@/lib/workspace.js';

export class WorkspaceContainer {
  // both useful, map use 16 times and arr use 20 times
  // basic containers
  readonly map = new Map<string, IndexedWorkspace>();
  readonly arr: IndexedWorkspace[] = [];

  // flagged containers, only stores workspace.id
  readonly activated: string[] = []; // Track currently opened workspaces by ID
  readonly deleting = new Set<string>(); // Track workspaces being deleted to avoid conflicts

  create(name: string, color: HexColor) {
    const workspace = new IndexedWorkspace(this.arr.length, name, color);
    this.map.set(workspace.id, workspace);
    this.arr.push(workspace);
    return workspace;
  }

  add(workspace: IndexedWorkspace) {
    workspace.index = this.arr.length;
    this.map.set(workspace.id, workspace);
    this.arr.push(workspace);
  }

  /**
   * Delete the workspace from all internal tracking structures
   */
  delete(id: string) {
    const workspace = this.map.get(id);
    if (!workspace) {
      return;
    }

    this.map.delete(id);
    const index = workspace.index;

    // & trust the index is correct
    this.arr.splice(index, 1);
    for (let i = index; i < this.arr.length; i++) {
      this.arr[i].index = i;
    }

    this.deactivate(id);
    this.removeDeleting(id);
  }

  /**
   * Only clear `map` and `arr`
   */
  clear() {
    this.map.clear();
    this.arr.length = 0;
  }

  /**
   * Clear all containers
   */
  clearAll() {
    this.map.clear();
    this.arr.length = 0;
    this.activated.length = 0;
    this.deleting.clear();
  }

  has(id: string) {
    return this.map.has(id);
  }

  get(id: string) {
    return this.map.get(id);
  }

  activate(id: string) {
    if (!this.activated.includes(id)) {
      this.activated.push(id);
    }
  }

  deactivate(id: string) {
    const index = this.activated.indexOf(id);
    if (index !== -1) {
      this.activated.splice(index, 1);
    }
  }

  deactivateAll() {
    this.activated.length = 0;
  }

  isActivated(id: string) {
    return this.activated.includes(id);
  }

  isDeleting(id: string) {
    return this.deleting.has(id);
  }

  addDeleting(id: string) {
    this.deleting.add(id);
  }

  removeDeleting(id: string) {
    this.deleting.delete(id);
  }

  isWorkspaceWindow(windowId: number) {
    return this.arr.some((ws) => ws.windowId === windowId);
  }
}
