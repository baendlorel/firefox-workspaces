import { EventBus } from 'minimal-event-bus';
import { btn, div, h } from '@/lib/dom.js';
import { $escapeHtml } from '@/lib/utils.js';
import entryIcon from './entry-icon.js';

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const container = h('ul', 'workspaces');

  // #from popup.setupDragAndDrop
  const registerDragAndDrop = (block: HTMLElement) => {
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
    if (workspaces.length === 0) {
      container.style.display = 'none';
      return;
    } else {
      container.style.display = 'block';
    }

    for (let i = 0; i < workspaces.length; i++) {
      const workspace = workspaces[i];

      const totalTabs = workspace.tabs.length + workspace.pinnedTabs.length;
      const pinnedCount = workspace.pinnedTabs.length;
      const countText = `${totalTabs} tabs${pinnedCount > 0 ? ` (${pinnedCount} pinned)` : ''}`;

      const openBtn = btn('btn-small', '🗖');
      const editBtn = btn('btn-small', '✏️');
      const deleteBtn = btn('btn-small', '🗑️');
      const toggleBtn = btn('btn-small', '🖲️');

      // & wb means workspace-block
      const item = h('li', { class: 'wb', 'data-workspace-id': workspace.id }, [
        div({ class: 'wb-li', style: `border-left-color:${workspace.color}` }, [
          entryIcon(workspace.color),
          div('wb-title', $escapeHtml(workspace.name)),
          div('wb-count', countText),
        ]),
      ]);

      openBtn.title = 'Open in new window';
      editBtn.title = 'Edit group';
      deleteBtn.title = 'Delete group';
      toggleBtn.title = 'Show/Hide tabs';

      openBtn.addEventListener('click', () => bus.emit('open', workspace));
      editBtn.addEventListener('click', () => bus.emit('edit', workspace));
      deleteBtn.addEventListener('click', () => bus.emit('delete', workspace));
      toggleBtn.addEventListener('click', () => item.classList.toggle('expanded'));
      registerDragAndDrop(item);

      container.appendChild(item);
    }
  };

  bus.on('render-list', renderList);

  return container;
};
