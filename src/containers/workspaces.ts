import { IndexedWorkspace } from '@/lib/workspace.js';

export class WorkspaceContainer {
  // both useful, map use 16 times and arr use 20 times
  readonly map = new Map<string, IndexedWorkspace>();
  readonly arr: IndexedWorkspace[] = [];
  readonly activated: string[] = []; // Track currently opened workspaces by ID
  readonly deleting = new Set<string>(); // Track workspaces being deleted to avoid conflicts

  add(workspace: IndexedWorkspace) {
    this.map.set(workspace.id, workspace);
    this.arr.push(workspace);
    workspace.index = this.arr.length - 1;
  }

  remove(id: string) {
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
  }

  clear() {
    this.map.clear();
    this.arr.length = 0;
  }

  has(id: string) {
    return this.map.has(id);
  }

  addActivated(id: string) {
    if (!this.activated.includes(id)) {
      this.activated.push(id);
    }
  }

  removeActivated(id: string) {
    const index = this.activated.indexOf(id);
    if (index !== -1) {
      this.activated.splice(index, 1);
    }
  }

  isActivated(id: string) {
    return this.activated.includes(id);
  }

  isDeleting(id: string) {
    return this.deleting.has(id);
  }

  setDeleting(id: string, deleting: boolean) {
    if (deleting) {
      this.deleting.add(id);
    } else {
      this.deleting.delete(id);
    }
  }
}
