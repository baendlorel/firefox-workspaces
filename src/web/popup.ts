import './css/main.css';
import './css/form.css';
import './css/dialog.css';

import { $send } from '@/lib/ext-apis.js';
import { Action, Consts } from '@/lib/consts.js';
import { $escapeHtml, $truncate } from '@/lib/utils.js';
import { $id, $queryAll, $query, h, div } from '@/lib/dom.js';
import { createMainPage } from './main.js';

// Popup JavaScript for Workspaces Manager
class WorkspacePopup {
  private readonly workspaces: Workspace[] = [];
  private main: ReturnType<typeof createMainPage>;

  constructor() {
    this.main = createMainPage();
    this.main.on('add-current-tab', () => this.showAddTabMenu());
    this.main.on('modal-save', (formData: WorkspaceFormData) => this.save(formData));
    this.init();
  }

  // Initialize popup
  async init() {
    await this.load();
    this.render();
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

  // Render work groups in the popup
  render() {
    const container = $id('workspacesList');
    const emptyState = $id('emptyState');

    if (this.workspaces.length === 0) {
      container.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    container.style.display = 'block';
    emptyState.style.display = 'none';

    for (let i = 0; i < this.workspaces.length; i++) {
      const workspace = this.workspaces[i];

      const totalTabs = workspace.tabs.length + workspace.pinnedTabs.length;
      const pinnedCount = workspace.pinnedTabs.length;
      const countText = `${totalTabs} tabs${pinnedCount > 0 ? ` (${pinnedCount} pinned)` : ''}`;

      let btnOpen: HTMLButtonElement;
      let btnEdit: HTMLButtonElement;
      let btnDelete: HTMLButtonElement;
      let btnToggle: HTMLButtonElement;
      // & wb means workspace-block
      const block = div({ class: 'wb', 'data-group-id': workspace.id }, [
        div({ class: 'wb-header', style: `border-left-color:${workspace.color}` }, [
          div('wb-title', $escapeHtml(workspace.name)),
          div('wb-count', countText),
        ]),
        div('wb-actions', [
          (btnOpen = h('button', 'btn-small', '🗖')),
          (btnEdit = h('button', 'btn-small', '✏️')),
          (btnDelete = h('button', 'btn-small', '🗑️')),
          (btnToggle = h('button', 'btn-small', '🖲️')),
        ]),
        div('workspace-tabs', this.renderWorkspaceTabs(workspace)),
      ]);

      btnOpen.title = 'Open in new window';
      btnEdit.title = 'Edit group';
      btnDelete.title = 'Delete group';
      btnToggle.title = 'Show/Hide tabs';

      btnOpen.addEventListener('click', () => this.open(workspace.id));
      btnEdit.addEventListener('click', () => this.edit(workspace.id));
      btnDelete.addEventListener('click', () => this.delete(workspace.id));
      btnToggle.addEventListener('click', () => this.toggle(workspace.id));

      // return `
      //   <div class="wb" data-group-id="${group.id}">
      //     <div class="wb-header" style="border-left-color: ${group.color}">
      //       <div>
      //         <div class="wb-title">${$escapeHtml(group.name)}</div>
      //         <div class="wb-count">
      //           ${totalTabs} tabs${pinnedCount > 0 ? ` (${pinnedCount} pinned)` : ''}
      //         </div>
      //       </div>
      //       <div class="wb-actions">
      //         <button class="btn-small" onclick="workspacesPopup.openWorkspaces('${
      //           group.id
      //         }')" title="Open in new window">
      //           🗖
      //         </button>
      //         <button class="btn-small" onclick="workspacesPopup.editGroup('${
      //           group.id
      //         }')" title="Edit group">
      //           ✏️
      //         </button>
      //         <button class="btn-small" onclick="workspacesPopup.deleteGroup('${
      //           group.id
      //         }')" title="Delete group">
      //           🗑️
      //         </button>
      //         <button class="btn-small" onclick="workspacesPopup.toggleGroup('${
      //           group.id
      //         }')" title="Show/Hide tabs">
      //           ▼
      //         </button>
      //       </div>
      //     </div>
      //     <div class="wb-tabs">
      //       ${this.renderWorkspaceTabs(group)}
      //     </div>
      //   </div>
      // `;
      container.appendChild(block);
    }

    this.setupDragAndDrop();
  }

  // Render tabs within a group
  renderWorkspaceTabs(workspace: Workspace) {
    const pinnedTabs = workspace.pinnedTabs;
    const regularTabs = workspace.tabs;

    const renderTab = (tab: TabInfo, pinned: boolean) => {
      const img = h('img', {
        src: tab.favIconUrl || 'icons/default-favicon.png',
        class: 'tab-favicon',
        onerror:
          'this.src=\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23f0f0f0"/><text x="8" y="12" text-anchor="middle" font-size="12" fill="%23666">?</text></svg>\'',
      });

      let btnPin: HTMLButtonElement;
      let btnRemove: HTMLButtonElement;

      const tabItem = div(
        { class: 'tab-item', 'data-tab-id': String(tab.id), 'data-tab-url': tab.url },
        [
          img,
          div('tab-info', [
            div('tab-title', $escapeHtml(tab.title)),
            div('tab-url', $escapeHtml($truncate(tab.url))),
          ]),
          pinned ? div('pinned-indicator', '📌') : '',
          div('tab-actions', [
            (btnPin = h('button', 'btn-small')),
            (btnRemove = h('button', 'btn-small')),
          ]),
        ]
      );

      btnPin.title = pinned ? 'Unpin tab' : 'Pin tab';
      btnRemove.title = 'Remove from workspace';
      btnPin.addEventListener('click', () => this.toggleTabPin(workspace.id, tab.id));
      btnRemove.addEventListener('click', () => this.removeTab(workspace.id, tab.id));

      const _ = `
      <div class="tab-item" data-tab-id="${tab.id}" data-tab-url="${tab.url}">
        <img class="tab-favicon" src="${tab.favIconUrl || 'icons/default-favicon.png'}" 
             onerror="this.src='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23f0f0f0"/><text x="8" y="12" text-anchor="middle" font-size="12" fill="%23666">?</text></svg>'">
        <div class="tab-info">
          <div class="tab-title">${$escapeHtml(tab.title || 'Untitled')}</div>
          <div class="tab-url">${$escapeHtml($truncate(tab.url))}</div>
        </div>
        ${pinned ? '<div class="pinned-indicator" title="Pinned tab">📌</div>' : ''}
        <div class="tab-actions">
          <button class="btn-small" onclick="workspacesPopup.toggleTabPin('${workspace.id}', '${
            tab.id
          }')" 
                  title="${pinned ? 'Unpin tab' : 'Pin tab'}">
            ${pinned ? '📌' : '📍'}
          </button>
          <button class="btn-small" onclick="workspacesPopup.removeTab('${workspace.id}', '${tab.id}')" 
                  title="Remove from group">
            ✕
          </button>
        </div>
      </div>
    `;

      return tabItem;
    };

    const elements: HTMLDivElement[] = [];

    for (let i = 0; i < pinnedTabs.length; i++) {
      elements.push(renderTab(pinnedTabs[i], true));
    }

    for (let i = 0; i < regularTabs.length; i++) {
      elements.push(renderTab(regularTabs[i], false));
    }

    if (elements.length === 0) {
      elements.push(
        div({ style: 'text-align: center; color: #666; padding: 20px;' }, 'No tabs in this group')
      );
    }

    return elements;
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
        this.render();
        this.main.close();
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
      this.main.edit(workspace);
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
          this.render();
        } else {
          alert('Failed to delete workspace');
        }
      } catch (error) {
        console.error('__NAME__: Error deleting workspace:', error);
        alert('Error deleting workspace');
      }
    }
  }

  // Toggle group expansion
  toggle(id: string) {
    const element = $query(`[data-group-id="${id}"]`);
    if (element) {
      element.classList.toggle('expanded');
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
        this.render();
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
        this.render();
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
        this.render();
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
          this.render();
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
document.addEventListener('DOMContentLoaded', () => {
  window.workspacesPopup = new WorkspacePopup();

  // load css
});

declare global {
  interface Window {
    workspacesPopup: WorkspacePopup;
  }
}
