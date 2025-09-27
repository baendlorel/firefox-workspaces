import { EventBus } from 'minimal-event-bus';
import { btn, div, h } from '@/lib/dom.js';

import createNewWorkspaceSvg from '@web/assets/plus.svg?raw';
import addTabSvg from '@web/assets/add-tab.svg?raw';

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  const newWorkspace = btn('btn btn-text');
  newWorkspace.style.width = '36px';
  newWorkspace.style.height = '36px';
  newWorkspace.innerHTML = createNewWorkspaceSvg;

  // todo 或者做成一个红色书签挂在header上？
  const addCurrentTab = btn('btn btn-text', 'Add Current');
  addCurrentTab.style.width = '36px';
  addCurrentTab.style.height = '36px';
  addCurrentTab.innerHTML = addTabSvg;

  newWorkspace.addEventListener('click', () => bus.emit('edit', null));
  addCurrentTab.addEventListener('click', () => bus.emit('add-current-tab'));

  return div('header', [h('h2', 'title', 'Workspace'), newWorkspace, addCurrentTab]);
};
