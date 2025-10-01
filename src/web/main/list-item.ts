import { div } from '@/lib/dom.js';
import { Workspace } from '@/lib/workspace.js';
import { wbicon } from './icon.js';

export default (workspace: Workspace, actionBtns: HTMLElement[] = []) => {
  const style = `border-left-color:${workspace.color};--wb-item-hover-bg:${workspace.color}20;--wb-item-active-bg:${workspace.color}40`;
  const el = div({ class: 'wb-item', style }, [
    wbicon(workspace.color),
    div('wb-title', workspace.name),
    div('wb-count', workspace.tabs.length.toString()),
  ]);

  if (actionBtns.length > 0) {
    el.appendChild(div('wb-actions', actionBtns));
    el.classList.add('with-action-btns');
  }

  return el;
};
