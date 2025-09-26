import { btn, div } from '@/lib/dom.js';
import { $escapeHtml } from '@/lib/utils.js';
import { EventBus } from '../../event-bus.js';

export default (bus: EventBus<WorkspaceEventMap>) => {
  const container = div('workspaces');

  const renderList = (workspaces: Workspace[]) => {
    // clear all children
    container.textContent = '';

    for (let i = 0; i < workspaces.length; i++) {
      const workspace = workspaces[i];

      const totalTabs = workspace.tabs.length + workspace.pinnedTabs.length;
      const pinnedCount = workspace.pinnedTabs.length;
      const countText = `${totalTabs} tabs${pinnedCount > 0 ? ` (${pinnedCount} pinned)` : ''}`;

      const btnOpen = btn('btn-small', '🗖');
      const btnEdit = btn('btn-small', '✏️');
      const btnDelete = btn('btn-small', '🗑️');
      const btnToggle = btn('btn-small', '🖲️');
      // & wb means workspace-block
      const block = div({ class: 'wb', 'data-workspace-id': workspace.id }, [
        div({ class: 'wb-header', style: `border-left-color:${workspace.color}` }, [
          div('wb-title', $escapeHtml(workspace.name)),
          div('wb-count', countText),
        ]),
        div('wb-actions', [btnOpen, btnEdit, btnDelete, btnToggle]),
        div('workspace-tabs', bus.emit('render-tab', workspace)[0]), // this.renderWorkspaceTabs(workspace)
      ]);

      btnOpen.title = 'Open in new window';
      btnEdit.title = 'Edit group';
      btnDelete.title = 'Delete group';
      btnToggle.title = 'Show/Hide tabs';

      btnOpen.addEventListener('click', () => bus.emit('open-workspace', workspace.id));
      btnEdit.addEventListener('click', () => bus.emit('edit-workspace', workspace));
      btnDelete.addEventListener('click', () => bus.emit('delete-workspace', workspace.id));
      btnToggle.addEventListener('click', () => block.classList.toggle('expanded'));

      // # origin
      // return `
      //   <div class="wb" data-workspace-id="${group.id}">
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
  };

  bus.on('render-list', renderList);

  return container;
};
