import { div } from '@/lib/dom.js';
import { wbicon } from './icon.js';

export default (workspace: Workspace, actionBtns: HTMLElement[] = []) => {
  const style = `border-left-color:${workspace.color};--wb-item-hover-bg:${workspace.color}20;--wb-item-active-bg:${workspace.color}40`;
  const title = div('wb-title', workspace.name);
  const el = div({ class: 'wb-item', style }, [
    wbicon(workspace.color),
    title,
    div('wb-count', workspace.tabs.length.toString()),
  ]);

  // fixme hover没有颜色，但dev环境有
  // Add lock icon if workspace has password (empty string = no password)
  title.classList.toggle('with-password', workspace.password !== '');
  if (actionBtns.length > 0) {
    el.appendChild(div('wb-actions', actionBtns));
    el.classList.add('with-action-btns');
  }

  return el;
};
