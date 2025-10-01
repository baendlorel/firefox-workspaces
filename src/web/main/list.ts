import { EventBus } from 'minimal-event-bus';
import { div, h, svg } from '@/lib/dom.js';

import editIcon from '@web/assets/3-dots.svg?raw';
import listItem from './list-item.js';
import { Workspace } from '@/lib/workspace.js';
import { Color } from '@/lib/color.js';

type WorkspaceLi = HTMLLIElement & { workspaceId: string; activatedColor: HexColor };

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const container = h('ul', 'workspaces');
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
      const editBtn = div('icon-btn text-muted ms-2', [svg(editIcon, 'var(--dark)', 16, 16)]);
      const wbli = listItem(workspace, [editBtn]);

      // Create workspace item with potential highlight
      const li = h('li', 'my-2', [wbli]) as WorkspaceLi;
      li.workspaceId = workspace.id;
      // todo 激活颜色
      li.activatedColor = Color.from(workspace.color).adjustBrightness(-0.2).toHex();

      // # register events
      li.addEventListener('click', () => bus.emit('open', workspace));
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        bus.emit('edit', workspace);
      });

      lis.push(li);
      container.appendChild(li);
    }
  };

  bus.on('render-list', renderList);
  bus.on('toggle-li-activated', (activated) => {
    for (let i = 0; i < lis.length; i++) {
      const li = lis[i];
      if (activated.includes(li.workspaceId)) {
        li.style.backgroundColor = li.activatedColor;
      }
    }
  });

  return container;
};
