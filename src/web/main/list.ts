import { EventBus } from 'minimal-event-bus';
import { btn, div, h, svg } from '@/lib/dom.js';
import { store } from '@/lib/storage.js';
import { i } from '@/lib/polyfilled-api.js';
import { passwordPrompt, info } from '@comp/dialog/alerts.js';
import popupService from '@web/popup.service.js';
import listItem from './list-item.js';

import threeDotsSvg from '@assets/3-dots.svg?raw';
import upSvg from '@assets/chevron-compact-up.svg?raw';
import downSvg from '@assets/chevron-compact-down.svg?raw';

type WorkspaceLi = HTMLLIElement & { dataset: { id: string } };

function createScroller(ul: HTMLUListElement) {
  // # template
  const up = div({ class: 'wb-ul-scroller fold', style: 'top:-10px' }, [svg(upSvg, undefined, 16)]);
  const down = div({ class: 'wb-ul-scroller fold', style: 'bottom:-10px' }, [
    svg(downSvg, undefined, 16),
  ]);

  // # register events
  const LI_COUNT_CAP = 10; // same as it is in css file
  const START_STEP = 1;
  const MAX_STEP = 2.1;
  const updateScrollerVisibility = (liCount: number) => {
    if (liCount <= LI_COUNT_CAP) {
      up.classList.add('fold');
      down.classList.add('fold');
      return;
    }

    if (
      liCount <= LI_COUNT_CAP ||
      ul.scrollHeight <= ul.clientHeight ||
      ul.style.display === 'none'
    ) {
      up.classList.add('fold');
      down.classList.add('fold');
      return;
    }

    up.classList.toggle('fold', ul.scrollTop <= 1);
    down.classList.toggle('fold', ul.scrollTop + ul.clientHeight >= ul.scrollHeight - 1);
  };
  const makeScrollerBehavior = (el: HTMLElement, direction: -1 | 1) => {
    let scrolling = false;
    let step = START_STEP;

    const doScroll = (direction: -1 | 1) => {
      if (getComputedStyle(el).opacity === '0') {
        scrolling = false;
      }

      if (!scrolling) {
        return;
      }

      if (step < MAX_STEP) {
        step += 0.005;
      }
      ul.scrollTop = ul.scrollTop + direction * step;
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

    for (let j = 0; j < workspaces.length; j++) {
      const workspace = workspaces[j];

      // & wb means workspace block
      const editBtn = btn('btn btn-trans btn-edit', [svg(threeDotsSvg, 'var(--dark)', 16)]);
      const wbli = listItem(workspace, [editBtn]);

      // Create workspace item with potential highlight
      const li = h('li', 'wb-li', [wbli]) as WorkspaceLi;
      li.dataset.id = workspace.id;

      // # register events
      const open = async () => {
        // Check if workspace has password (empty string = no password)
        if (workspace.password !== '') {
          // Check if locked
          const lockTime = popupService.getRemainingLockTime(workspace);
          if (lockTime > 0) {
            info(i('dialog.workspace-locked.message', lockTime));
            return;
          }

          // Prompt for password
          const password = await passwordPrompt(workspace);
          if (password === null) {
            // User cancelled
            return;
          }

          const result = await popupService.verifyPassword(workspace, password);
          switch (result) {
            case PasswordCheckResult.Correct:
              break;
            case PasswordCheckResult.Incorrect: {
              const remainingAttempts = 3 - (workspace.failedAttempts || 0);
              if (remainingAttempts > 0) {
                info(i('dialog.incorrect-password.message', remainingAttempts));
              } else {
                info(i('dialog.incorrect-password.locked'));
              }
              return;
            }
            case PasswordCheckResult.Locked: {
              const lockTime = popupService.getRemainingLockTime(workspace);
              info(i('dialog.workspace-locked.message', lockTime));
              return;
            }
          }
          // If result is 'correct', continue to open
        }

        popupService.open(workspace);
      };
      li.addEventListener('click', open);
      // todo 修改固定的意思，固定的意思是指这个tab不会因为关闭的时候没它就被从workspace里删除
      // todo 打开的工作区里，顶部栏是不是加点颜色？
      // todo 有时候点一下打不开新窗口，是不是自动重试?
      // todo pin until：对于fixed的页面，会自动被pin，且关闭后依然存在
      li.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          open();
        }
      });

      editBtn.addEventListener('click', (e) => {
        // Prevent triggering li click event, which opens the workspace
        e.stopPropagation();
        bus.emit('edit', workspace);
      });

      lis.push(li);
      ul.appendChild(li);
    }

    updateScrollerVisibility(lis.length);
  };

  bus.on('render-list', async () => {
    const { workspaces } = await store.localGet('workspaces');
    renderList(workspaces);
    bus.emit('toggle-empty-state', workspaces.length === 0);
  });

  return container;
};
