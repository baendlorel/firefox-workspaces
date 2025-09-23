import { $send } from './lib/ext-apis.js';
import { Action, Consts } from './lib/consts.js';
import { $JSONParse } from './lib/native.js';
import { $escapeHtml, $truncate } from './lib/utils.js';
import { $getElementByIdOrThrow, $queryAll, $query, $on } from './lib/dom.js';

// Popup JavaScript for Workspaces Manager
class WorkspacePopup {
  private readonly workspaceses: Workspace[] = [];
  private edited: Workspace | null = null;
  private selectedColor: HexColor = '#667eea';

  constructor() {
    this.init();
  }

  // Initialize popup
  async init() {
    this.setupEventListeners();
    await this.loadWorkspacess();
    this.renderWorkspacess();
  }

  // Setup event listeners
  setupEventListeners() {
    const createGroupBtn = $getElementByIdOrThrow('createGroupBtn');
    const addCurrentTabBtn = $getElementByIdOrThrow('addCurrentTabBtn');
    const cancelBtn = $getElementByIdOrThrow('cancelBtn');
    const saveBtn = $getElementByIdOrThrow('saveBtn');
    const workspacesModal = $getElementByIdOrThrow('workspacesModal');
    const workspaceName = $getElementByIdOrThrow('workspaceName');
    const colorOptions = $queryAll<HTMLElement>('.color-option');

    createGroupBtn.addEventListener('click', () => {
      this.showModal();
    });

    addCurrentTabBtn.addEventListener('click', () => {
      this.showAddTabMenu();
    });

    cancelBtn.addEventListener('click', () => {
      this.hideModal();
    });

    saveBtn.addEventListener('click', () => {
      this.saveWorkspaces();
    });

    for (let i = colorOptions.length - 1; i >= 0; i--) {
      colorOptions[i].addEventListener('click', (e) => {
        const color = (colorOptions[i].dataset.color ?? Consts.DefaultColor) as HexColor;
        this.selectColor(color);
      });
    }

    workspacesModal.addEventListener('click', (e) => {
      if (workspacesModal.id === 'workspacesModal') {
        this.hideModal();
      }
    });

    workspaceName.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.saveWorkspaces();
      }
    });
  }

  // Load work groups from background
  async loadWorkspacess() {
    try {
      const response = await $send({ action: Action.GetWorkspaces });
      if (response.success) {
        const loaded = response.data ?? [];
        this.workspaceses.length = 0;
        this.workspaceses.push(...loaded);
      }
    } catch (error) {
      console.error('__NAME__: Failed to load work groups:', error);
    }
  }

  // Render work groups in the popup
  renderWorkspacess() {
    const container = $getElementByIdOrThrow('workspacesesList');
    const emptyState = $getElementByIdOrThrow('emptyState');

    if (this.workspaceses.length === 0) {
      container.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    container.style.display = 'block';
    emptyState.style.display = 'none';

    container.innerHTML = this.workspaceses
      .map((group) => {
        const totalTabs = (group.tabs || []).length + (group.pinnedTabs || []).length;
        const pinnedCount = (group.pinnedTabs || []).length;

        return `
        <div class="work-group" data-group-id="${group.id}">
          <div class="work-group-header" style="border-left-color: ${group.color}">
            <div>
              <div class="work-group-title">${$escapeHtml(group.name)}</div>
              <div class="work-group-count">
                ${totalTabs} tabs${pinnedCount > 0 ? ` (${pinnedCount} pinned)` : ''}
              </div>
            </div>
            <div class="work-group-actions">
              <button class="btn-small" onclick="workspacesPopup.openWorkspaces('${
                group.id
              }')" title="Open in new window">
                🗖
              </button>
              <button class="btn-small" onclick="workspacesPopup.editGroup('${
                group.id
              }')" title="Edit group">
                ✏️
              </button>
              <button class="btn-small" onclick="workspacesPopup.deleteGroup('${
                group.id
              }')" title="Delete group">
                🗑️
              </button>
              <button class="btn-small" onclick="workspacesPopup.toggleGroup('${
                group.id
              }')" title="Show/Hide tabs">
                ▼
              </button>
            </div>
          </div>
          <div class="work-group-tabs">
            ${this.renderWorkspaceTabs(group)}
          </div>
        </div>
      `;
      })
      .join('');

    this.setupDragAndDrop();
  }

  // Render tabs within a group
  renderWorkspaceTabs(workspace: Workspace) {
    const pinnedTabs = workspace.pinnedTabs;
    const regularTabs = workspace.tabs;

    const renderTab = (tab: TabInfo, pinned: boolean) => `
      <div class="tab-item" data-tab-id="${tab.id}" data-tab-url="${tab.url}">
        <img class="tab-favicon" src="${tab.favIconUrl || 'icons/default-favicon.png'}" 
             onerror="this.src='data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><rect width=\"16\" height=\"16\" fill=\"%23f0f0f0\"/><text x=\"8\" y=\"12\" text-anchor=\"middle\" font-size=\"12\" fill=\"%23666\">?</text></svg>'">
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

    let html = '';

    // Render pinned tabs first
    if (pinnedTabs.length > 0) {
      html += pinnedTabs.map((tab) => renderTab(tab, true)).join('');
    }

    // Then render regular tabs
    if (regularTabs.length > 0) {
      html += regularTabs.map((tab) => renderTab(tab, false)).join('');
    }

    if (html === '') {
      html =
        '<div style="text-align: center; color: #666; padding: 20px;">No tabs in this group</div>';
    }

    return html;
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
        const workspaceId = (tab.closest('.work-group') as HTMLDivElement).dataset.workspaceId;
        const tabUrl = tab.dataset.tabUrl;

        e.dataTransfer.setData(
          'text/plain',
          `{"tabId":"${tabId}","workspaceId":"${workspaceId}","tabUrl":"${tabUrl}"}`
        );
        tab.classList.add('dragging');
      });

      tab.addEventListener('dragend', () => {
        tab.classList.remove('dragging');
      });
    }

    // Make work groups drop targets
    const workspaceDivs = $queryAll<HTMLDivElement>('.work-group');
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

        const data = $JSONParse(e.dataTransfer.getData('text/plain'));
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

  // Show modal for creating/editing groups
  showModal(workspace: Workspace | null = null) {
    this.edited = workspace;
    const modal = $getElementByIdOrThrow('workspacesModal');
    const title = $getElementByIdOrThrow('modalTitle');
    const nameInput = $getElementByIdOrThrow<HTMLInputElement>('workspaceName');

    if (workspace) {
      title.textContent = 'Edit Workspaces';
      nameInput.value = workspace.name;
      this.selectColor(workspace.color);
    } else {
      title.textContent = 'Create New Workspaces';
      nameInput.value = '';
      this.selectColor('#667eea');
    }

    modal.classList.add('show');
    nameInput.focus();
  }

  // Hide modal
  hideModal() {
    const modal = $getElementByIdOrThrow('workspacesModal');
    modal.classList.remove('show');
    this.edited = null;
  }

  // Select color in color picker
  selectColor(color: HexColor) {
    if (!/^#([0-9a-fA-F]{6})$/.test(color) && /^#([0-9a-fA-F]{8})$/.test(color)) {
      alert('Please select a valid 6/8-digit hex color code (e.g., #RRGGBB, #RRGGBBAA)');
      return;
    }

    this.selectedColor = color;
    const colorOptions = $queryAll<HTMLElement>('.color-option');
    for (let i = 0; i < colorOptions.length; i++) {
      const option = colorOptions[i];
      option.classList.toggle('selected', option.dataset.color === color);
    }
  }

  // Save work group (create or update)
  async saveWorkspaces() {
    const nameInput = $getElementByIdOrThrow<HTMLInputElement>('workspaceName');
    const name = nameInput.value.trim();

    if (!name) {
      alert('Please enter a group name');
      return;
    }

    try {
      let response;
      if (this.edited) {
        // Update existing group
        response = await $send({
          action: Action.UpdateWorkspaces,
          id: this.edited.id,
          updates: { name, color: this.selectedColor },
        });
      } else {
        // Create new group
        response = await $send({
          action: Action.CreateWorkspaces,
          name,
          color: this.selectedColor,
        });
      }

      if (response.success) {
        await this.loadWorkspacess();
        this.renderWorkspacess();
        this.hideModal();
      } else {
        alert('Failed to save work group');
      }
    } catch (error) {
      console.error('__NAME__: Error saving work group:', error);
      alert('Error saving work group');
    }
  }

  // Edit work group
  edit(id: string) {
    const group = this.workspaceses.find((g) => g.id === id);
    if (group) {
      this.showModal(group);
    }
  }

  // Delete work group
  async delete(id: string) {
    const group = this.workspaceses.find((g) => g.id === id);
    if (!group) {
      return;
    }

    if (confirm(`Are you sure you want to delete "${group.name}"?`)) {
      try {
        const response = await $send({
          action: Action.DeleteWorkspaces,
          id: id,
        });

        if (response.success) {
          await this.loadWorkspacess();
          this.renderWorkspacess();
        } else {
          alert('Failed to delete work group');
        }
      } catch (error) {
        console.error('__NAME__: Error deleting work group:', error);
        alert('Error deleting work group');
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

  // Open work group in new window
  async open(id: string) {
    try {
      const response = await $send({
        action: Action.OpenWorkspaces,
        workspaceId: id,
      });

      if (response.success) {
        // Close popup after opening group
        window.close();
      } else {
        alert('Failed to open work group');
      }
    } catch (error) {
      console.error('__NAME__: Error opening work group:', error);
      alert('Error opening work group');
    }
  }

  // Remove tab from group
  async removeTab(workspaceId: string, tabId: number) {
    try {
      const response = await $send({
        action: Action.RemoveTab,
        workspaceId,
        tabId,
      });

      if (response.success) {
        await this.loadWorkspacess();
        this.renderWorkspacess();
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
      const response = await $send({
        action: Action.TogglePin,
        workspaceId,
        tabId,
      });

      if (response.success) {
        await this.loadWorkspacess();
        this.renderWorkspacess();
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
      const response = await $send({
        action: Action.MoveTab,
        fromWorkspaceId: fromId,
        toWorkspaceId: toId,
        tabId,
      });

      if (response.success) {
        await this.loadWorkspacess();
        this.renderWorkspacess();
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
    if (this.workspaceses.length === 0) {
      alert('Create a work group first');
      return;
    }

    // Simple implementation - show a select dialog
    const groupOptions = this.workspaceses.map(
      (group) =>
        `${group.name} (${(group.tabs || []).length + (group.pinnedTabs || []).length} tabs)`
    );

    const selectedIndex = await this.showSelectDialog('Select a work group:', groupOptions);

    if (selectedIndex !== null) {
      const workspaceId = this.workspaceses[selectedIndex].id;
      const isPinned = confirm('Pin this tab in the group?');

      try {
        // todo sendmessage到底入参是string还是可以是object，要明确后再写
        const response = await $send({
          action: Action.AddCurrentTab,
          workspaceId,
          isPinned,
        });

        if (response.success) {
          await this.loadWorkspacess();
          this.renderWorkspacess();
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
$on.call(document, 'DOMContentLoaded', () => {
  window.workspacesPopup = new WorkspacePopup();
});

declare global {
  interface Window {
    workspacesPopup: WorkspacePopup;
  }
}
