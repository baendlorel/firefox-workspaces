import { Action } from './consts.js';
import { $getElementById, $query, $queryAll } from './lib.js';

// Popup JavaScript for Workspaces Manager
class WorkspacePopup {
  private readonly workspaceses: Workspace[] = [];
  private currentEditingGroup: Workspace | null = null;
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
    // todo 加入断言来判定是否能找到
    // Create group button
    $getElementById('createGroupBtn').addEventListener('click', () => {
      this.showModal();
    });

    // Add current tab button
    $getElementById('addCurrentTabBtn').addEventListener('click', () => {
      this.showAddTabMenu();
    });

    // Modal controls
    $getElementById('cancelBtn').addEventListener('click', () => {
      this.hideModal();
    });

    $getElementById('saveBtn').addEventListener('click', () => {
      this.saveWorkspaces();
    });

    // Color picker
    $queryAll('.color-option').forEach((option) => {
      option.addEventListener('click', (e) => {
        this.selectColor(e.target.dataset.color);
      });
    });

    // Close modal when clicking outside
    $getElementById('workspacesModal').addEventListener('click', (e) => {
      if (e.target.id === 'workspacesModal') {
        this.hideModal();
      }
    });

    // Enter key to save
    $getElementById('groupName').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.saveWorkspaces();
      }
    });
  }

  // Load work groups from background
  async loadWorkspacess() {
    try {
      const response = await this.sendMessage({ action: Action.GetWorkspacess });
      if (response.success) {
        this.workspaceses = response.data || [];
      }
    } catch (error) {
      console.error('__NAME__: Failed to load work groups:', error);
    }
  }

  // Render work groups in the popup
  renderWorkspacess() {
    const container = $getElementById('workspacesesList');
    const emptyState = $getElementById('emptyState');

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
              <div class="work-group-title">${this.escapeHtml(group.name)}</div>
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
            ${this.renderGroupTabs(group)}
          </div>
        </div>
      `;
      })
      .join('');

    this.setupDragAndDrop();
  }

  // Render tabs within a group
  renderGroupTabs(group) {
    const pinnedTabs = group.pinnedTabs || [];
    const regularTabs = group.tabs || [];

    const renderTab = (tab, isPinned) => `
      <div class="tab-item" data-tab-id="${tab.id}" data-tab-url="${tab.url}">
        <img class="tab-favicon" src="${tab.favIconUrl || 'icons/default-favicon.png'}" 
             onerror="this.src='data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><rect width=\"16\" height=\"16\" fill=\"%23f0f0f0\"/><text x=\"8\" y=\"12\" text-anchor=\"middle\" font-size=\"12\" fill=\"%23666\">?</text></svg>'">
        <div class="tab-info">
          <div class="tab-title">${this.escapeHtml(tab.title || 'Untitled')}</div>
          <div class="tab-url">${this.escapeHtml(this.truncate(tab.url))}</div>
        </div>
        ${isPinned ? '<div class="pinned-indicator" title="Pinned tab">📌</div>' : ''}
        <div class="tab-actions">
          <button class="btn-small" onclick="workspacesPopup.toggleTabPin('${group.id}', '${
            tab.id
          }')" 
                  title="${isPinned ? 'Unpin tab' : 'Pin tab'}">
            ${isPinned ? '📌' : '📍'}
          </button>
          <button class="btn-small" onclick="workspacesPopup.removeTab('${group.id}', '${tab.id}')" 
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
    // Make tab items draggable
    document.querySelectorAll('.tab-item').forEach((tab) => {
      tab.draggable = true;

      tab.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData(
          'text/plain',
          JSON.stringify({
            tabId: tab.dataset.tabId,
            workspaceId: tab.closest('.work-group').dataset.workspaceId,
            tabUrl: tab.dataset.tabUrl,
          })
        );
        tab.classList.add('dragging');
      });

      tab.addEventListener('dragend', () => {
        tab.classList.remove('dragging');
      });
    });

    // Make work groups drop targets
    document.querySelectorAll('.work-group').forEach((group) => {
      group.addEventListener('dragover', (e) => {
        e.preventDefault();
        group.classList.add('drag-over');
      });

      group.addEventListener('dragleave', (e) => {
        if (!group.contains(e.relatedTarget)) {
          group.classList.remove('drag-over');
        }
      });

      group.addEventListener('drop', async (e) => {
        e.preventDefault();
        group.classList.remove('drag-over');

        try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          const targetGroupId = group.dataset.workspaceId;

          if (data.workspaceId !== targetGroupId) {
            await this.moveTab(data.workspaceId, targetGroupId, data.tabId);
          }
        } catch (error) {
          console.error('__NAME__: Error handling drop:', error);
        }
      });
    });
  }

  // Show modal for creating/editing groups
  showModal(group = null) {
    this.currentEditingGroup = group;
    const modal = $getElementById('workspacesModal');
    const title = $getElementById('modalTitle');
    const nameInput = $getElementById('groupName');

    if (group) {
      title.textContent = 'Edit Workspaces';
      nameInput.value = group.name;
      this.selectColor(group.color);
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
    const modal = $getElementById('workspacesModal');
    modal.classList.remove('show');
    this.currentEditingGroup = null;
  }

  // Select color in color picker
  selectColor(color) {
    this.selectedColor = color;
    document.querySelectorAll('.color-option').forEach((option) => {
      option.classList.toggle('selected', option.dataset.color === color);
    });
  }

  // Save work group (create or update)
  async saveWorkspaces() {
    const nameInput = $getElementById('groupName');
    const name = nameInput.value.trim();

    if (!name) {
      alert('Please enter a group name');
      return;
    }

    try {
      let response;
      if (this.currentEditingGroup) {
        // Update existing group
        response = await this.sendMessage({
          action: 'updateWorkspaces',
          id: this.currentEditingGroup.id,
          updates: { name, color: this.selectedColor },
        });
      } else {
        // Create new group
        response = await this.sendMessage({
          action: 'createWorkspaces',
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
  editGroup(workspaceId) {
    const group = this.workspaceses.find((g) => g.id === workspaceId);
    if (group) {
      this.showModal(group);
    }
  }

  // Delete work group
  async deleteGroup(workspaceId) {
    const group = this.workspaceses.find((g) => g.id === workspaceId);
    if (!group) return;

    if (confirm(`Are you sure you want to delete "${group.name}"?`)) {
      try {
        const response = await this.sendMessage({
          action: 'deleteWorkspaces',
          id: workspaceId,
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
  toggleWorkspace(id: string) {
    const element = $query(`[data-group-id="${id}"]`);
    if (element) {
      element.classList.toggle('expanded');
    }
  }

  // Open work group in new window
  async openWorkspaces(id: string) {
    try {
      const response = await this.sendMessage({
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
  async removeTab(workspaceId, tabId) {
    try {
      const response = await this.sendMessage({
        action: 'removeTab',
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
  async toggleTabPin(workspaceId, tabId) {
    try {
      const response = await this.sendMessage({
        action: 'togglePin',
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
  async moveTab(fromGroupId, toGroupId, tabId) {
    try {
      const response = await this.sendMessage({
        action: 'moveTab',
        fromGroupId,
        toGroupId,
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
        const response = await this.sendMessage({
          action: 'addCurrentTab',
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

  // Send message to background script
  sendMessage(message: string) {
    return new Promise((resolve) => {
      browser.runtime.sendMessage(message, resolve);
    });
  }
}

// Initialize popup when DOM is loaded
let workspacesPopup;

document.addEventListener('DOMContentLoaded', () => {
  workspacesPopup = new WorkspacePopup();
});
