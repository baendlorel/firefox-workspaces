import { btn, div } from '@/lib/dom.js';
import { $escapeHtml } from '@/lib/utils.js';
import { EventBus } from '@web/event-bus.js';

export default (bus: EventBus<WorkspaceEventMap>) => {
  const container = div('workspaces');

  // #from popup.setupDragAndDrop
  const registerDragAndDrop = (block: HTMLDivElement) => {
    block.addEventListener('dragover', (e) => {
      e.preventDefault();
      block.classList.add('drag-over');
    });

    block.addEventListener('dragleave', (e) => {
      if (!block.contains(e.relatedTarget as Node)) {
        block.classList.remove('drag-over');
      }
    });

    block.addEventListener('drop', async (e) => {
      e.preventDefault();
      block.classList.remove('drag-over');
      if (!e.dataTransfer) {
        throw new Error('[__NAME__: __func__]setupDragAndDrop e.dataTransfer is null');
      }

      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as DraggingData;
      const workspaceId = block.dataset.workspaceId;

      if (data.workspaceId !== workspaceId) {
        if (workspaceId === undefined) {
          throw new Error('[__NAME__: __func__]setupDragAndDrop workspaceId is undefined.');
        }
        bus.emit('move-tab', data.workspaceId, workspaceId, data.tabId);
        // await this.moveTab(data.workspaceId, workspaceId, data.tabId);
      }
    });
  };

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

      btnOpen.addEventListener('click', () => bus.emit('open-workspace', workspace));
      btnEdit.addEventListener('click', () => bus.emit('edit-workspace', workspace));
      btnDelete.addEventListener('click', () => bus.emit('delete-workspace', workspace));
      btnToggle.addEventListener('click', () => block.classList.toggle('expanded'));
      registerDragAndDrop(block);

      container.appendChild(block);
    }
  };

  bus.on('render-list', renderList);

  return container;
};
