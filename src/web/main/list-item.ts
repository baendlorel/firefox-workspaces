import { div } from '@/lib/dom.js';
import { Workspace } from '@/lib/workspace.js';
import { wbicon } from './icon.js';

export default (workspace: Workspace, actionBtns: HTMLElement[] = []) => {
  const totalTabs = workspace.tabs.length + workspace.pinnedTabs.length;
  const pinnedCount = workspace.pinnedTabs.length;
  const count = `${totalTabs} tabs${pinnedCount > 0 ? ` (${pinnedCount} pinned)` : ''}`;

  const style = `border-left-color:${workspace.color};--wb-item-hover-bg:${workspace.color}24;--wb-item-active-bg:${workspace.color}46`;
  const el = div({ class: 'wb-item', style }, [
    wbicon(workspace.color),
    div('wb-title', workspace.name),
    div('wb-count', count),
  ]);

  if (actionBtns.length > 0) {
    el.appendChild(div('wb-actions', actionBtns));
    el.classList.add('with-action-btns');
  }

  return el;
};
