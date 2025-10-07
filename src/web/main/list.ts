import { EventBus } from 'minimal-event-bus';
import { btn, div, h, svg } from '@/lib/dom.js';
import { store } from '@/lib/storage.js';
import popupService from '@web/popup.service.js';
import listItem from './list-item.js';

import threeDotsSvg from '@assets/3-dots.svg?raw';
import upSvg from '@assets/chevron-compact-up.svg?raw';
import downSvg from '@assets/chevron-compact-down.svg?raw';

type WorkspaceLi = HTMLLIElement & { dataset: { id: string } };

function createScroller(ul: HTMLUListElement) {
  const START_STEP = 1;
  const MAX_STEP = 2.1;

  const up = div('wb-ul-scroller', [svg(upSvg, undefined, 16)]);
  const down = div('wb-ul-scroller', [svg(downSvg, undefined, 16)]);
  up.style.top = '-10px';
  down.style.bottom = '-10px';

  const updateScrollerVisibility = () => {
    // If list not visible or empty, hide both
    if (ul.style.display === 'none' || ul.scrollHeight <= ul.clientHeight) {
      up.classList.remove('hidden');
      down.classList.remove('hidden');
      return;
    }

    up.classList.toggle('hidden', ul.scrollTop <= 1);
    down.classList.toggle('hidden', ul.scrollTop + ul.clientHeight >= ul.scrollHeight - 1);
  };

  // Continuous hold behavior: 5 times per second => 200ms interval
  const makeScrollerBehavior = (el: HTMLElement, direction: -1 | 1) => {
    let scrolling = false;
    let step = START_STEP;

    const doScroll = (direction: -1 | 1) => {
      if (!scrolling) {
        return;
      }
      if (step < MAX_STEP) {
        step += 0.005;
      }
      ul.scrollTop = ul.scrollTop + direction * step;
      console.log(direction * step);
      requestAnimationFrame(() => doScroll(direction));
    };

    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      scrolling = true;
      step = START_STEP;
      doScroll(direction);
    });

    ['mouseup', 'mouseleave', 'mouseout', 'pointerup', 'pointercancel'].forEach((ev) => {
      el.addEventListener(ev, () => (scrolling = false));
    });
  };

  makeScrollerBehavior(up, -1);
  makeScrollerBehavior(down, 1);

  // update visibility on manual scrolls
  ul.addEventListener('scroll', () => requestAnimationFrame(updateScrollerVisibility));

  return { up, down, updateScrollerVisibility };
}

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const ul = h('ul', 'wb-ul');
  const lis: WorkspaceLi[] = [];
  const { up, down, updateScrollerVisibility } = createScroller(ul);

  const container = div('wb-ul-container', [ul, up, down]);

  const renderList = (workspaces: Workspace[]) => {
    // clear all children
    ul.textContent = '';
    lis.length = 0;
    if (workspaces.length === 0) {
      ul.style.display = 'none';
      return;
    } else {
      ul.style.display = 'block';
    }

    for (let i = 0; i < workspaces.length; i++) {
      const workspace = workspaces[i];

      // & wb means workspace block
      const editBtn = btn({ class: 'btn btn-trans', style: 'padding:4px 5px' }, [
        svg(threeDotsSvg, 'var(--dark)', 16),
      ]);
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
      ul.appendChild(li);
    }

    updateScrollerVisibility();
  };

  // $ reserved
  const _activateHighlight = (activated: string[]) => {
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
    const { workspaces } = await store.localGet('workspaces');
    renderList(workspaces);
    bus.emit('toggle-empty-state', workspaces.length === 0);
  });

  return container;
};
