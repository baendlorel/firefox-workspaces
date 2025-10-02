import { EventBus } from 'minimal-event-bus';
import { btn, h, svg } from '@/lib/dom.js';
import { $lsget } from '@/lib/ext-apis.js';
import { Workspace } from '@/lib/workspace.js';
import popupService from '@web/popup.service.js';

import editIcon from '@web/assets/3-dots.svg?raw';
import listItem from './list-item.js';

type WorkspaceLi = HTMLLIElement & { dataset: { id: string } };

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const container = h('ul', 'wb-ul');
  const lis: WorkspaceLi[] = [];

  const renderList = (workspaces: Workspace[]) => {
    // clear all children
    container.textContent = '';
    lis.length = 0;
    if (workspaces.length === 0) {
      container.style.display = 'none';
      return;
    } else {
      container.style.display = 'block';
    }

    for (let i = 0; i < workspaces.length; i++) {
      const workspace = workspaces[i];

      // & wb means workspace-block
      const editBtn = btn('icon-btn text-muted', [svg(editIcon, 'var(--dark)', 16, 16)]);
      const wbli = listItem(workspace, [editBtn]);

      // Create workspace item with potential highlight
      const li = h('li', 'wb-li', [wbli]) as WorkspaceLi;
      li.dataset.id = workspace.id;

      // # register events
      li.addEventListener('click', () => popupService.open(workspace));

      editBtn.addEventListener('click', (e) => {
        // Prevent triggering li click event, which opens the workspace
        e.stopPropagation();
        bus.emit('edit', workspace);
      });

      lis.push(li);
      container.appendChild(li);
    }
  };

  const activateHighlight = (activated: string[]) => {
    for (let i = 0; i < lis.length; i++) {
      const li = lis[i];
      if (activated.includes(li.dataset.id)) {
        li.classList.add('activated');
      } else {
        li.classList.remove('activated');
      }
    }
  };

  bus.on('render-list', async () => {
    const workspaces = await $lsget('workspaces');
    renderList(workspaces);
    bus.emit('toggle-empty-state', workspaces.length === 0);
  });

  return container;
};
