import { EventBus } from 'minimal-event-bus';
import { div, h } from '@/lib/dom.js';

import editIcon from '@web/assets/3-dots.svg?raw';
import listItem from './list-item.js';

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

  const renderList = (workspaces: Workspace[], activeWorkspaces: string[] = []) => {
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
      const isActive = activeWorkspaces.includes(workspace.id);

      // & wb means workspace-block
      const editBtn = div('icon-btn text-muted ms-auto');
      editBtn.innerHTML = editIcon;
      const wbli = listItem(workspace, [editBtn]);

      // Create workspace item with potential highlight
      const item = h('li', { class: 'my-2', 'data-workspace-id': workspace.id }, [wbli]);

      // Add highlight effect for active workspaces
      if (isActive) {
        wbli.style.backgroundColor = `${workspace.color}33`;
      }

      // # register events
      item.addEventListener('click', () => bus.emit('open', workspace));
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        bus.emit('edit', workspace);
      });
      registerDragAndDrop(item);

      container.appendChild(item);
    }
  };

  bus.on('render-list', renderList);

  return container;
};
