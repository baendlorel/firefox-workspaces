import '@/lib/polyfill.js';
import { Color } from './color.js';
import { $genId } from './utils.js';

export const createWorkspace = (formData: WorkspaceFormData): Workspace => ({
  id: $genId(),
  name: formData.name,
  color: formData.color,
  tabs: formData.tabs,
  createdAt: Date.now(),
  lastOpened: 0,
  password: formData.password,
  passpeek: formData.passpeek,
  failedAttempts: NaN,
  lockUntil: NaN,
});

export const isValidWorkspace = (o: Workspace) => {
  if (typeof o !== 'object' || o === null) {
    return false;
  }

  // & ignores createdAt and lastOpened, since they are not necessary
  const basicValid =
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    Color.valid(o.color) &&
    Array.isArray(o.tabs) &&
    o.tabs.every(isValidWorkspaceTab);

  if (!basicValid) {
    return false;
  }

  // Validate required password fields (now required for hidden class optimization)
  if (typeof o.password !== 'string') {
    return false;
  }
  if (typeof o.passpeek !== 'string') {
    return false;
  }
  // Allow NaN for numeric fields (indicates no attempts/lock)
  if (typeof o.failedAttempts !== 'number') {
    return false;
  }
  if (typeof o.lockUntil !== 'number') {
    return false;
  }

  return true;
};

export const isValidWorkspaces = (o: Workspace[]): o is Workspace[] => {
  return Array.isArray(o) && o.every((w) => isValidWorkspace(w));
};

export const createWorkspaceTab = (tab: browser.tabs.Tab): WorkspaceTab => {
  if (tab.id === undefined || tab.id === browser.tabs.TAB_ID_NONE) {
    throw new TypeError('WorkspaceTab: browserTab.id is undefined or TAB_ID_NONE');
  }
  return {
    id: tab.id,
    index: tab.index,
    title: tab.title ?? '',
    url: tab.url ?? '',
    pinned: tab.pinned ?? false,
  };
};

export const isValidWorkspaceTab = (o: any): o is WorkspaceTab => {
  return (
    Number.isSafeInteger(o.id) &&
    o.id >= 0 &&
    Number.isSafeInteger(o.index) &&
    o.index >= 0 &&
    typeof o.url === 'string' &&
    typeof o.title === 'string' &&
    typeof o.pinned === 'boolean'
  );
};
