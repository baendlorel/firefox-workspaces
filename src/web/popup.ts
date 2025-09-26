import './css/main.css';
import './css/form.css';
import './css/dialog.css';

import { $send } from '@/lib/ext-apis.js';
import { Action } from '@/lib/consts.js';
import { createMainPage } from './main.js';
import selectDialog from './components/dialog/select-dialog.js';
import { danger, info } from './components/dialog/alerts.js';

// Popup JavaScript for Workspaces Manager
class PopupPage {
  private readonly workspaces: Workspace[] = [];
  private main: ReturnType<typeof createMainPage>;

  constructor() {
    this.main = createMainPage();

    // tabs
    this.main.on('add-current-tab', () => this.showAddTabMenu());
    this.main.on('toggle-tab-pin', (id: string, tabId: number) => this.toggleTabPin(id, tabId));
    this.main.on('remove-tab', (id: string, tabId: number) => this.removeTab(id, tabId));
    this.main.on('move-tab', (fromId: string, toId: string, tabId: number) =>
      this.moveTab(fromId, toId, tabId)
    );

    // form modal
    this.main.on('open', (workspace: Workspace) => this.open(workspace));
    this.main.on('save', (formData: WorkspaceFormData) => this.save(formData));
    this.main.on('delete', (workspace: Workspace) => this.delete(workspace));

    this.init();
  }

  // Initialize popup
  async init() {
    await this.load();
    this.render();
  }

  render() {
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
        this.render();
        this.main.emit('close-editor');
      } else {
        info('Failed to save workspace, Please try again');
      }
    } catch (error) {
      console.error('[__NAME__: __func__] Error saving workspace:', error);
      danger('Error saving workspace');
    }
  }

  // Delete workspace
  async delete(workspace: Workspace) {
    if (!confirm(`Are you sure you want to delete "${workspace.name}"?`)) {
      return;
    }
    try {
      const response = await $send<DeleteWorkspacesRequest>({
        action: Action.DeleteWorkspaces,
        id: workspace.id,
      });

      if (response.success) {
        await this.load();
        this.render();
      } else {
        info('Failed to delete workspace, Please try again');
      }
    } catch (error) {
      console.error('[__NAME__: __func__] Error deleting workspace:', error);
      danger('Error deleting workspace');
    }
  }

  // Open workspace in new window
  async open(workspace: Workspace) {
    try {
      const response = await $send<OpenWorkspacesRequest>({
        action: Action.OpenWorkspaces,
        workspaceId: workspace.id,
      });

      if (response.success) {
        // Close popup after opening group
        window.close();
      } else {
        info('Failed to open workspace, Please try again');
      }
    } catch (error) {
      console.error('[__NAME__: __func__] Error opening workspace:', error);
      danger('Error opening workspace');
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
        this.render();
      } else {
        info('Failed to remove tab, Please try again');
      }
    } catch (error) {
      console.error('[__NAME__: __func__] Error removing tab:', error);
      danger('Error removing tab');
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
        this.render();
      } else {
        info('Failed to toggle pin, Please try again');
      }
    } catch (error) {
      console.error('[__NAME__: __func__] Error toggling pin:', error);
      danger('Error toggling pin');
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
        this.render();
      } else {
        info('Failed to move tab, Please try again');
      }
    } catch (error) {
      console.error('[__NAME__: __func__] Error moving tab:', error);
      danger('Error moving tab');
    }
  }

  // Show menu to add current tab to a group
  async showAddTabMenu() {
    if (this.workspaces.length === 0) {
      info('Create a workspace first');
      return;
    }

    // Simple implementation - show a select dialog
    const options = this.workspaces.map((w) => ({
      label: `${w.name} (${w.tabs.length + w.pinnedTabs.length} tabs)`,
      value: w.id,
    }));

    const selectedIndex = await selectDialog({ title: 'Select a workspace:', options });

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
          this.render();
        } else {
          info('Failed to add tab to group, Please try again');
        }
      } catch (error) {
        console.error('[__NAME__: __func__] Error adding tab to group:', error);
        danger('Error adding tab to group');
      }
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => (window.popup = new PopupPage()));

declare global {
  interface Window {
    popup: PopupPage;
  }
}
