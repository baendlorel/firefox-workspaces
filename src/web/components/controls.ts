import { btn, div } from '@/lib/dom.js';

export default () => {
  const newWorkspaceBtn = btn('btn', 'New Workspace');
  const addCurrentTabBtn = btn('btn btn-secondary', 'Add Current Tab');

  return {
    newWorkspaceBtn,
    addCurrentTabBtn,
    controls: div('controls', [newWorkspaceBtn, addCurrentTabBtn]),
  };
};
