import { btn, div } from '@/lib/dom.js';

export default (handlers: ComponentControlsArgs) => {
  const newWorkspaceBtn = btn('btn', 'New Workspace');
  const addCurrentTabBtn = btn('btn btn-secondary', 'Add Current Tab');
  newWorkspaceBtn.addEventListener('click', handlers.onNewWorkspace);
  addCurrentTabBtn.addEventListener('click', handlers.onAddCurrentTab);

  return div('controls', [newWorkspaceBtn, addCurrentTabBtn]);
};
