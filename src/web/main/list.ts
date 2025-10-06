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
  const ROW_HEIGHT = 33; // & same as var(--wbli-height)

  const up = div('wb-ul-scroller', [svg(upSvg, undefined, 16)]);
  const down = div('wb-ul-scroller', [svg(downSvg, undefined, 16)]);
  up.style.top = '-10px';
  down.style.bottom = '-10px';

  // Scroll helpers
  const showEl = (el: HTMLElement) => {
    el.hidden = false;
    el.style.display = '';
  };
  const hideEl = (el: HTMLElement) => {
    el.hidden = true;
    el.style.display = 'none';
  };

  const updateScrollerVisibility = () => {
    // If list not visible or empty, hide both
    if (ul.style.display === 'none' || ul.scrollHeight <= ul.clientHeight) {
      hideEl(up);
      hideEl(down);
      return;
    }

    // at top
    if (ul.scrollTop <= 1) {
      hideEl(up);
    } else {
      showEl(up);
    }

    // at bottom
    if (ul.scrollTop + ul.clientHeight >= ul.scrollHeight - 1) {
      hideEl(down);
    } else {
      showEl(down);
    }
  };

  const doScroll = (direction: -1 | 1) => {
    ul.scrollBy({ top: direction * ROW_HEIGHT, left: 0, behavior: 'auto' });
    // update visibility after scroll (some browsers may need RAF)
    requestAnimationFrame(updateScrollerVisibility);
  };

  // Continuous hold behavior: 5 times per second => 200ms interval
  const makeScrollerBehavior = (el: HTMLElement, direction: -1 | 1) => {
    let holding = false;
    let intervalId: number | null = null;
    let justHeld = false;

    const clearHold = () => {
      holding = false;
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      justHeld = true;
      // avoid a following click firing immediately after hold
      setTimeout(() => (justHeld = false), 250);
    };

    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      if (holding) return;
      holding = true;
      // immediate scroll once
      doScroll(direction);
      intervalId = window.setInterval(() => doScroll(direction), 200);
    });

    // pointerup / leave handlers
    ['mouseup', 'mouseleave', 'mouseout', 'pointerup', 'pointercancel'].forEach((ev) => {
      el.addEventListener(ev, () => {
        if (holding) {
          clearHold();
        }
      });
    });

    // click for single step (ignore if it was a hold)
    el.addEventListener('click', (e) => {
      if ((e as MouseEvent).defaultPrevented) return;
      if (justHeld) return;
      doScroll(direction);
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
