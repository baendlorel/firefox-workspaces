import { $send } from './lib/ext-apis.js';
import { Action, Consts, WORKSPACE_COLORS } from './lib/consts.js';
import { $escapeHtml, $truncate } from './lib/utils.js';
import { $id, $queryAll, $query, h, div } from './lib/dom.js';

// import './assets/css/popup.css';

// Popup JavaScript for Workspaces Manager
class WorkspacePopup {
  private readonly workspaceses: Workspace[] = [];
  private edited: Workspace | null = null;
  private selectedColor: HexColor = Consts.DefaultColor;

  constructor() {
    this.init();
  }

  // Initialize popup
  async init() {
    this.setup();
    await this.load();
    this.render();
  }

  // Setup elements and events
  setup() {
    // # setup events
    $id('createGroupBtn').addEventListener('click', () => this.showModal());
    $id('addCurrentTabBtn').addEventListener('click', () => this.showAddTabMenu());
    $id('cancelBtn').addEventListener('click', () => this.hideModal());
    $id('saveBtn').addEventListener('click', () => this.saveWorkspaces());
    $id('closeBtn').addEventListener('click', () => this.hideModal());
    $id('workspaceName').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.saveWorkspaces();
      }
    });

    // # Modal
    const workspacesModal = $id<HTMLDialogElement>('workspacesModal');
    // Handle ESC key
    workspacesModal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideModal();
      }
    });

    // Close dialog when clicking on backdrop (outside the dialog content)
    workspacesModal.addEventListener('click', (e) => {
      if (e.target === workspacesModal) {
        this.hideModal();
      }
    });

    // # Workspace color picker
    const colorPickerOptions = WORKSPACE_COLORS.map((color) => {
      const el = div('color-option');
      el.style.backgroundColor = color;
      el.dataset.color = color;
      el.addEventListener('click', () => this.selectColor(color));
      return el;
    });
    $id('workspaceColorPicker').append(...colorPickerOptions);
  }

  // Load work groups from background
  async load() {
    try {
      const response = await $send<GetWorkspacesRequest>({ action: Action.GetWorkspaces });
      if (response.success) {
        const loaded = response.data ?? [];
        this.workspaceses.length = 0;
        this.workspaceses.push(...loaded);
      }
    } catch (error) {
      console.error('[__NAME__: __func__] Failed to load work groups:', error);
    }
  }

  // Render work groups in the popup
  render() {
    const container = $id('workspacesList');
    const emptyState = $id('emptyState');

    if (this.workspaceses.length === 0) {
      container.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    container.style.display = 'block';
    emptyState.style.display = 'none';

    for (let i = 0; i < this.workspaceses.length; i++) {
      const workspace = this.workspaceses[i];

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

  // Show modal for creating/editing groups with enhanced animation
  showModal(workspace: Workspace | null = null) {
    this.edited = workspace;
    const modal = $id<HTMLDialogElement>('workspacesModal');
    const title = $id('modalTitle');
    const nameInput = $id<HTMLInputElement>('workspaceName');

    if (workspace) {
      title.textContent = 'Edit Workspaces';
      nameInput.value = workspace.name;
      this.selectColor(workspace.color);
    } else {
      title.textContent = 'Create New Workspaces';
      nameInput.value = '';
      this.selectColor(Consts.DefaultColor);
    }

    // Remove any existing animation classes
    modal.classList.remove('animate-in', 'animate-out');

    modal.showModal();

    // Add entrance animation
    requestAnimationFrame(() => {
      modal.classList.add('animate-in');
    });

    nameInput.focus();
  }

  // Hide modal with enhanced animation
  hideModal() {
    const modal = $id<HTMLDialogElement>('workspacesModal');

    // Add exit animation
    modal.classList.remove('animate-in');
    modal.classList.add('animate-out');

    // Close after animation completes
    setTimeout(() => {
      modal.close();
      modal.classList.remove('animate-out');
      this.edited = null;
    }, 250); // Match the animation duration
  }

  // Select color in color picker
  selectColor(color: HexColor) {
    // if (!/^#([0-9a-fA-F]{6})$/.test(color) && /^#([0-9a-fA-F]{8})$/.test(color)) {
    //   alert('Please select a valid 6/8-digit hex color code (e.g., #RRGGBB, #RRGGBBAA)');
    //   return;
    // }

    this.selectedColor = color;
    const options = $queryAll<HTMLElement>('#workspaceColorPicker .color-option');

    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      option.classList.toggle('selected', option.dataset.color === color);
    }
  }

  // Save work group (create or update)
  async saveWorkspaces() {
    const nameInput = $id<HTMLInputElement>('workspaceName');
    const name = nameInput.value.trim();

    if (!name) {
      alert('Please enter a group name');
      return;
    }

    try {
      let response;
      if (this.edited) {
        // Update existing group
        response = await $send<UpdateWorkspacesRequest>({
          action: Action.UpdateWorkspaces,
          id: this.edited.id,
          updates: { name, color: this.selectedColor },
        });
      } else {
        // Create new group
        response = await $send<CreateWorkspacesRequest>({
          action: Action.CreateWorkspaces,
          name,
          color: this.selectedColor,
        });
      }

      if (response.success) {
        await this.load();
        this.render();
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
        const response = await $send<DeleteWorkspacesRequest>({
          action: Action.DeleteWorkspaces,
          id: id,
        });

        if (response.success) {
          await this.load();
          this.render();
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
      const response = await $send<OpenWorkspacesRequest>({
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
    if (this.workspaceses.length === 0) {
      alert('Create a work group first');
      return;
    }

    // Simple implementation - show a select dialog
    const options = this.workspaceses.map(
      (w) => `${w.name} (${w.tabs.length + w.pinnedTabs.length} tabs)`
    );

    const selectedIndex = await this.showSelectDialog('Select a work group:', options);

    if (selectedIndex !== null) {
      const workspaceId = this.workspaceses[selectedIndex].id;
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
