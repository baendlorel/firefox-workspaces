import './css/theme.css';
import './css/main.css';
import './css/workspace.css';
import './css/form.css';
import '@/lib/promise-ext.js';

import { $send } from '@/lib/ext-apis.js';
import { Action, Sym } from '@/lib/consts.js';
import { IndexedWorkspace, Workspace } from '@/lib/workspace.js';

import { danger, info } from './components/dialog/alerts.js';
import { stringify } from './main/debug.js';
import { createView } from './view.js';

Promise.prototype.fallbackWithDialog = function <S = typeof Sym.Reject>(
  this: Promise<any>,
  message: string,
  value: any = Sym.Reject
): Promise<S> {
  return Promise.prototype.catch.call(this, (error: unknown) => {
    if (message) {
      logger.debug(message, error);
      danger(message);
    } else {
      logger.debug(error);
    }
    return typeof value === 'function' ? value() : value;
  });
};

// Popup JavaScript for Workspaces Manager
class PopupPage {
  get isWorkspacePopupPage() {
    return true;
  }
  private main: ReturnType<typeof createView>;

  constructor() {
    logger.verbose('PopupPage initializing');
    this.main = createView();
    this.main.on('debug', () => logger.debug(stringify(this.workspaces)));

    // form modal
    this.main.on('open', (workspace: Workspace) => this.open(workspace));
    this.main.on('save', (formData: WorkspaceFormData) => this.save(formData));
    this.main.on('delete', (workspace: Workspace) => this.delete(workspace));

    this.main.emit('set-current');

    if (__IS_DEV__) {
      import('./__mock__/toolbar.js').then(() => this.init());
      return;
    }
    this.init();
  }

  // Initialize popup
  async init() {
    await this.load();
    this.render();

    // Check current window on initialization
    await this.checkCurrentWindow();
  }

  // Check if current window belongs to a workspace and update header

  render() {
    this.main.emit('render-list', this.workspaces, this.activeWorkspaces);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => (window.popup = new PopupPage()));

declare global {
  interface Window {
    popup: PopupPage;
  }
}
