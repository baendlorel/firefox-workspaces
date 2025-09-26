import './css/main.css';
import './css/form.css';
import './css/dialog.css';

import { $send } from '@/lib/ext-apis.js';
import { Action } from '@/lib/consts.js';
import { $queryAll, $query } from '@/lib/dom.js';
import { createMainPage } from './main.js';

// Popup JavaScript for Workspaces Manager
class PopupPage {
  private readonly workspaces: Workspace[] = [];
  private main: ReturnType<typeof createMainPage>;

  constructor() {
    this.main = createMainPage();
    this.main.on('add-current-tab', () => this.showAddTabMenu());
    this.main.on('modal-save', (formData: WorkspaceFormData) => this.save(formData));
    this.main.on('toggle-tab-pin', (id: string, tabId: number) => this.toggleTabPin(id, tabId));
    this.init();
  }

  // Initialize popup
  async init() {
    await this.load();
    this.main.emit('render-list', this.workspaces);
  }

  // Load work groups from background
  async load() {
    try {
      const response = await $send<GetWorkspacesRequest>({ action: Action.GetWorkspaces });
      if (response.success) {
        const loaded = response.data ?? [];
        this.workspaces.length = 0;
        this.workspaces.push(...loaded);
      }
    } catch (error) {
      console.error('[__NAME__: __func__] Failed to load work groups:', error);
    }
  }

  // Setup drag and drop functionality
  setupDragAndDrop() {
    const tabItems = $queryAll<HTMLDivElement>('.tab-item');

    // Make tab items draggable
    for (let i = 0; i < tabItems.length; i++) {
      const tab = tabItems[i];
      tab.draggable = true;

      tab.addEventListener('dragstart', (e) => {
        if (!e.dataTransfer) {
          throw new Error('__NAME__:setupDragAndDrop e.dataTransfer is null');
        }

        const tabId = tab.dataset.tabId;
        const workspaceId = (tab.closest('.wb') as HTMLDivElement)?.dataset.workspaceId;
        const tabUrl = tab.dataset.tabUrl;

        if (workspaceId === undefined) {
          throw new Error(`__NAME__:setupDragAndDrop tab.closest('.wb') is undefined.`);
        }

        e.dataTransfer.setData(
          'text/plain',
          `{"tabId":${tabId},"workspaceId":"${workspaceId}","tabUrl":"${tabUrl}"}`
        );
        tab.classList.add('dragging');
      });

      tab.addEventListener('dragend', () => {
        tab.classList.remove('dragging');
      });
    }

    // Make work groups drop targets
    const workspaceDivs = $queryAll<HTMLDivElement>('.wb');
    for (let i = 0; i < workspaceDivs.length; i++) {
      const workspaceDiv = workspaceDivs[i];
      workspaceDiv.addEventListener('dragover', (e) => {
        e.preventDefault();
        workspaceDiv.classList.add('drag-over');
      });

      workspaceDiv.addEventListener('dragleave', (e) => {
        if (!workspaceDiv.contains(e.relatedTarget as Node)) {
          workspaceDiv.classList.remove('drag-over');
        }
      });

      workspaceDiv.addEventListener('drop', async (e) => {
        e.preventDefault();
        workspaceDiv.classList.remove('drag-over');
        if (!e.dataTransfer) {
          throw new Error('__NAME__:setupDragAndDrop e.dataTransfer is null');
        }

        const data = JSON.parse(e.dataTransfer.getData('text/plain')) as DraggingData;
        const workspaceId = workspaceDiv.dataset.workspaceId;

        if (data.workspaceId !== workspaceId) {
          if (workspaceId === undefined) {
            throw new Error('__NAME__:setupDragAndDrop workspaceId is undefined.');
          }
          await this.moveTab(data.workspaceId, workspaceId, data.tabId);
        }
      });
    }
  }

  // Save workspace (create or update)
  async save(formData: WorkspaceFormData) {
    try {
      let response;
      const workspace = this.main.getEditingWorkspace();
      if (workspace) {
        // Update existing group
        response = await $send<UpdateWorkspacesRequest>({
          action: Action.UpdateWorkspaces,
          id: workspace.id,
          updates: formData,
        });
      } else {
        // Create new group
        response = await $send<CreateWorkspacesRequest>({
          action: Action.CreateWorkspaces,
          name: formData.name,
          color: formData.color,
        });
      }

      if (response.success) {
        await this.load();
        this.main.emit('render-list', this.workspaces);
        this.main.emit('close-modal');
      } else {
        alert('Failed to save workspace');
      }
    } catch (error) {
      console.error('__NAME__: Error saving workspace:', error);
      alert('Error saving workspace');
    }
  }

  // Edit workspace
  edit(id: string) {
    const workspace = this.workspaces.find((g) => g.id === id);
    if (workspace) {
      this.main.emit('edit-workspace', workspace);
    } else {
      alert('Workspace not found, id: ' + id);
    }
  }

  // Delete workspace
  async delete(id: string) {
    const group = this.workspaces.find((g) => g.id === id);
    if (!group) {
      return;
    }

    if (confirm(`Are you sure you want to delete "${group.name}"?`)) {
      try {
        const response = await $send<DeleteWorkspacesRequest>({
          action: Action.DeleteWorkspaces,
          id: id,
        });

        if (response.success) {
          await this.load();
          this.main.emit('render-list', this.workspaces);
        } else {
          alert('Failed to delete workspace');
        }
      } catch (error) {
        console.error('__NAME__: Error deleting workspace:', error);
        alert('Error deleting workspace');
      }
    }
  }

  // Open workspace in new window
  async open(id: string) {
    try {
      const response = await $send<OpenWorkspacesRequest>({
        action: Action.OpenWorkspaces,
        workspaceId: id,
      });

      if (response.success) {
        // Close popup after opening group
        window.close();
      } else {
        alert('Failed to open workspace');
      }
    } catch (error) {
      console.error('__NAME__: Error opening workspace:', error);
      alert('Error opening workspace');
    }
  }

  // Remove tab from group
  async removeTab(workspaceId: string, tabId: number) {
    try {
      const response = await $send<RemoveTabRequest>({
        action: Action.RemoveTab,
        workspaceId,
        tabId,
      });

      if (response.success) {
        await this.load();
        this.main.emit('render-list', this.workspaces);
      } else {
        alert('Failed to remove tab');
      }
    } catch (error) {
      console.error('__NAME__: Error removing tab:', error);
      alert('Error removing tab');
    }
  }

  // Toggle tab pin status
  async toggleTabPin(workspaceId: string, tabId: number) {
    try {
      const response = await $send<TogglePinRequest>({
        action: Action.TogglePin,
        workspaceId,
        tabId,
      });

      if (response.success) {
        await this.load();
        this.main.emit('render-list', this.workspaces);
      } else {
        alert('Failed to toggle pin');
      }
    } catch (error) {
      console.error('__NAME__: Error toggling pin:', error);
      alert('Error toggling pin');
    }
  }

  // Move tab between groups
  async moveTab(fromId: string, toId: string, tabId: number) {
    try {
      const response = await $send<MoveTabRequest>({
        action: Action.MoveTab,
        fromWorkspaceId: fromId,
        toWorkspaceId: toId,
        tabId,
      });

      if (response.success) {
        await this.load();
        this.main.emit('render-list', this.workspaces);
      } else {
        alert('Failed to move tab');
      }
    } catch (error) {
      console.error('__NAME__: Error moving tab:', error);
      alert('Error moving tab');
    }
  }

  // Show menu to add current tab to a group
  async showAddTabMenu() {
    if (this.workspaces.length === 0) {
      alert('Create a workspace first');
      return;
    }

    // Simple implementation - show a select dialog
    const options = this.workspaces.map(
      (w) => `${w.name} (${w.tabs.length + w.pinnedTabs.length} tabs)`
    );

    const selectedIndex = await this.showSelectDialog('Select a workspace:', options);

    if (selectedIndex !== null) {
      const workspaceId = this.workspaces[selectedIndex].id;
      const pinned = confirm('Pin this tab in the group?');

      try {
        const response = await $send<AddCurrentTabRequest>({
          action: Action.AddCurrentTab,
          workspaceId,
          pinned,
        });

        if (response.success) {
          await this.load();
          this.main.emit('render-list', this.workspaces);
        } else {
          alert('Failed to add tab to group');
        }
      } catch (error) {
        console.error('__NAME__: Error adding tab to group:', error);
        alert('Error adding tab to group');
      }
    }
  }

  // Show a simple select dialog (simplified version)
  async showSelectDialog(title: string, options: string[]): Promise<number | null> {
    const choice = prompt(
      title +
        '\n\n' +
        options.map((opt, i) => `${i + 1}. ${opt}`).join('\n') +
        '\n\nEnter the number of your choice:'
    );

    if (choice) {
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < options.length) {
        return index;
      }
    }
    return null;
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => (window.popup = new PopupPage()));

declare global {
  interface Window {
    popup: PopupPage;
  }
}
