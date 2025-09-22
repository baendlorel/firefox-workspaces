// Popup JavaScript for Work Group Manager
class WorkGroupPopup {
  constructor() {
    this.workGroups = [];
    this.currentEditingGroup = null;
    this.selectedColor = '#667eea';
    this.init();
  }

  // Initialize popup
  async init() {
    this.setupEventListeners();
    await this.loadWorkGroups();
    this.renderWorkGroups();
  }

  // Setup event listeners
  setupEventListeners() {
    // Create group button
    document.getElementById('createGroupBtn').addEventListener('click', () => {
      this.showModal();
    });

    // Add current tab button
    document.getElementById('addCurrentTabBtn').addEventListener('click', () => {
      this.showAddTabMenu();
    });

    // Modal controls
    document.getElementById('cancelBtn').addEventListener('click', () => {
      this.hideModal();
    });

    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveWorkGroup();
    });

    // Color picker
    document.querySelectorAll('.color-option').forEach((option) => {
      option.addEventListener('click', (e) => {
        this.selectColor(e.target.dataset.color);
      });
    });

    // Close modal when clicking outside
    document.getElementById('workGroupModal').addEventListener('click', (e) => {
      if (e.target.id === 'workGroupModal') {
        this.hideModal();
      }
    });

    // Enter key to save
    document.getElementById('groupName').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.saveWorkGroup();
      }
    });
  }

  // Load work groups from background
  async loadWorkGroups() {
    try {
      const response = await this.sendMessage({ action: 'getWorkGroups' });
      if (response.success) {
        this.workGroups = response.data || [];
      }
    } catch (error) {
      console.error('Failed to load work groups:', error);
    }
  }

  // Render work groups in the popup
  renderWorkGroups() {
    const container = document.getElementById('workGroupsList');
    const emptyState = document.getElementById('emptyState');

    if (this.workGroups.length === 0) {
      container.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    container.style.display = 'block';
    emptyState.style.display = 'none';

    container.innerHTML = this.workGroups
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
              <button class="btn-small" onclick="workGroupPopup.openWorkGroup('${
                group.id
              }')" title="Open in new window">
                🗖
              </button>
              <button class="btn-small" onclick="workGroupPopup.editGroup('${
                group.id
              }')" title="Edit group">
                ✏️
              </button>
              <button class="btn-small" onclick="workGroupPopup.deleteGroup('${
                group.id
              }')" title="Delete group">
                🗑️
              </button>
              <button class="btn-small" onclick="workGroupPopup.toggleGroup('${
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
          <div class="tab-url">${this.escapeHtml(this.truncateUrl(tab.url))}</div>
        </div>
        ${isPinned ? '<div class="pinned-indicator" title="Pinned tab">📌</div>' : ''}
        <div class="tab-actions">
          <button class="btn-small" onclick="workGroupPopup.toggleTabPin('${group.id}', '${
      tab.id
    }')" 
                  title="${isPinned ? 'Unpin tab' : 'Pin tab'}">
            ${isPinned ? '📌' : '📍'}
          </button>
          <button class="btn-small" onclick="workGroupPopup.removeTab('${group.id}', '${tab.id}')" 
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
            groupId: tab.closest('.work-group').dataset.groupId,
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
          const targetGroupId = group.dataset.groupId;

          if (data.groupId !== targetGroupId) {
            await this.moveTab(data.groupId, targetGroupId, data.tabId);
          }
        } catch (error) {
          console.error('Error handling drop:', error);
        }
      });
    });
  }

  // Show modal for creating/editing groups
  showModal(group = null) {
    this.currentEditingGroup = group;
    const modal = document.getElementById('workGroupModal');
    const title = document.getElementById('modalTitle');
    const nameInput = document.getElementById('groupName');

    if (group) {
      title.textContent = 'Edit Work Group';
      nameInput.value = group.name;
      this.selectColor(group.color);
    } else {
      title.textContent = 'Create New Work Group';
      nameInput.value = '';
      this.selectColor('#667eea');
    }

    modal.classList.add('show');
    nameInput.focus();
  }

  // Hide modal
  hideModal() {
    const modal = document.getElementById('workGroupModal');
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
  async saveWorkGroup() {
    const nameInput = document.getElementById('groupName');
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
          action: 'updateWorkGroup',
          id: this.currentEditingGroup.id,
          updates: { name, color: this.selectedColor },
        });
      } else {
        // Create new group
        response = await this.sendMessage({
          action: 'createWorkGroup',
          name,
          color: this.selectedColor,
        });
      }

      if (response.success) {
        await this.loadWorkGroups();
        this.renderWorkGroups();
        this.hideModal();
      } else {
        alert('Failed to save work group');
      }
    } catch (error) {
      console.error('Error saving work group:', error);
      alert('Error saving work group');
    }
  }

  // Edit work group
  editGroup(groupId) {
    const group = this.workGroups.find((g) => g.id === groupId);
    if (group) {
      this.showModal(group);
    }
  }

  // Delete work group
  async deleteGroup(groupId) {
    const group = this.workGroups.find((g) => g.id === groupId);
    if (!group) return;

    if (confirm(`Are you sure you want to delete "${group.name}"?`)) {
      try {
        const response = await this.sendMessage({
          action: 'deleteWorkGroup',
          id: groupId,
        });

        if (response.success) {
          await this.loadWorkGroups();
          this.renderWorkGroups();
        } else {
          alert('Failed to delete work group');
        }
      } catch (error) {
        console.error('Error deleting work group:', error);
        alert('Error deleting work group');
      }
    }
  }

  // Toggle group expansion
  toggleGroup(groupId) {
    const groupElement = document.querySelector(`[data-group-id="${groupId}"]`);
    if (groupElement) {
      groupElement.classList.toggle('expanded');
    }
  }

  // Open work group in new window
  async openWorkGroup(groupId) {
    try {
      const response = await this.sendMessage({
        action: 'openWorkGroup',
        groupId,
      });

      if (response.success) {
        // Close popup after opening group
        window.close();
      } else {
        alert('Failed to open work group');
      }
    } catch (error) {
      console.error('Error opening work group:', error);
      alert('Error opening work group');
    }
  }

  // Remove tab from group
  async removeTab(groupId, tabId) {
    try {
      const response = await this.sendMessage({
        action: 'removeTab',
        groupId,
        tabId,
      });

      if (response.success) {
        await this.loadWorkGroups();
        this.renderWorkGroups();
      } else {
        alert('Failed to remove tab');
      }
    } catch (error) {
      console.error('Error removing tab:', error);
      alert('Error removing tab');
    }
  }

  // Toggle tab pin status
  async toggleTabPin(groupId, tabId) {
    try {
      const response = await this.sendMessage({
        action: 'togglePin',
        groupId,
        tabId,
      });

      if (response.success) {
        await this.loadWorkGroups();
        this.renderWorkGroups();
      } else {
        alert('Failed to toggle pin');
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
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
        await this.loadWorkGroups();
        this.renderWorkGroups();
      } else {
        alert('Failed to move tab');
      }
    } catch (error) {
      console.error('Error moving tab:', error);
      alert('Error moving tab');
    }
  }

  // Show menu to add current tab to a group
  async showAddTabMenu() {
    if (this.workGroups.length === 0) {
      alert('Create a work group first');
      return;
    }

    // Simple implementation - show a select dialog
    const groupOptions = this.workGroups.map(
      (group) =>
        `${group.name} (${(group.tabs || []).length + (group.pinnedTabs || []).length} tabs)`
    );

    const selectedIndex = await this.showSelectDialog('Select a work group:', groupOptions);

    if (selectedIndex !== null) {
      const groupId = this.workGroups[selectedIndex].id;
      const isPinned = confirm('Pin this tab in the group?');

      try {
        const response = await this.sendMessage({
          action: 'addCurrentTab',
          groupId,
          isPinned,
        });

        if (response.success) {
          await this.loadWorkGroups();
          this.renderWorkGroups();
        } else {
          alert('Failed to add tab to group');
        }
      } catch (error) {
        console.error('Error adding tab to group:', error);
        alert('Error adding tab to group');
      }
    }
  }

  // Show a simple select dialog (simplified version)
  async showSelectDialog(title, options) {
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
  sendMessage(message) {
    return new Promise((resolve) => {
      browser.runtime.sendMessage(message, resolve);
    });
  }

  // Utility functions
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  truncateUrl(url) {
    if (!url) return '';
    if (url.length <= 50) return url;
    return url.substring(0, 47) + '...';
  }
}

// Initialize popup when DOM is loaded
let workGroupPopup;

document.addEventListener('DOMContentLoaded', () => {
  workGroupPopup = new WorkGroupPopup();
});
