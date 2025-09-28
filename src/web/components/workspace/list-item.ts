import { div } from '@/lib/dom.js';
import { wbicon } from './icon.js';

export default (workspace: Workspace, actionBtns: HTMLElement[] = []) => {
  const totalTabs = workspace.tabs.length + workspace.pinnedTabs.length;
  const pinnedCount = workspace.pinnedTabs.length;
  const count = `${totalTabs} tabs${pinnedCount > 0 ? ` (${pinnedCount} pinned)` : ''}`;

  const style = `border-left-color:${workspace.color};--wb-list-item-hover-bg:${workspace.color}21`;
  const el = div({ class: 'wb-list-item', style }, [
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
