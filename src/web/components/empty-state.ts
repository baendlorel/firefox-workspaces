import { div, h } from '@/lib/dom.js';
import folderIcon from '@/web/assets/folder.svg';

export default () => {
  const icon = h('img', 'empty-state-icon');
  icon.src = folderIcon;

  return div({ class: 'empty-state', style: 'display: none' }, [
    icon,
    h('p', '', 'No workspaces yet.'),
    h('p', '', 'Create a new workspace to get started!'),
  ]);
};
