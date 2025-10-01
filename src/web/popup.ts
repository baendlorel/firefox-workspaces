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

  private readonly workspaces: Workspace[] = [];
  private readonly activeWorkspaces: string[] = []; // Track active workspace IDs
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
  async checkCurrentWindow() {
    const currentWindow = await browser.windows.getCurrent();

    const workspace = this.workspaces.find((w) => w.windowId === currentWindow.id);
    if (workspace) {
      this.main.emit('set-current', workspace);
    }
  }

  render() {
    this.main.emit('render-list', this.workspaces, this.activeWorkspaces);
  }

  // Load work groups from background
  async load() {
    const response = await $send<GetWorkspacesRequest>({
      action: Action.GetWorkspaces,
    }).fallbackWithDialog('Failed to load work groups', {
      success: false,
      data: [],
      activeWorkspaces: [],
    });

    if (!response.success) {
      return;
    }

    const loaded = response.data ?? [];
    this.workspaces.length = 0;
    for (let i = 0; i < loaded.length; i++) {
      const w = loaded[i];
      this.workspaces.push(IndexedWorkspace.load(NaN, w));
    }

    // Update active workspaces
    this.activeWorkspaces.length = 0;
    if (response.activeWorkspaces) {
      this.activeWorkspaces.push(...response.activeWorkspaces);
    }
  }

  // Save workspace (create or update)
  async save(formData: WorkspaceFormData) {
    let response;
    if (formData.id === undefined) {
      // Create new workspace
      response = await $send<CreateWorkspaceRequest>({
        action: Action.CreateWorkspace,
        name: formData.name,
        color: formData.color,
      }).fallbackWithDialog('__func__: Failed saving workspace');
    } else {
      // Update existing group
      response = await $send<UpdateWorkspaceRequest>({
        action: Action.UpdateWorkspace,
        id: formData.id,
        updates: formData,
      }).fallbackWithDialog('__func__: Failed saving workspace');
    }

    if (response === Sym.Reject) {
      return;
    }

    if (response.success) {
      await this.load();
      this.render();
      this.main.emit('close-editor');
    } else {
      info('Failed to save workspace, Please try again.');
      logger.error('Save workspace failed', response);
    }
  }

  // Delete workspace
  async delete(workspace: Workspace) {
    const response = await $send<DeleteWorkspaceRequest>({
      action: Action.DeleteWorkspace,
      id: workspace.id,
    }).fallbackWithDialog('__func__: Error deleting workspace');

    if (response === Sym.Reject) {
      return;
    }

    if (response.success) {
      await this.load();
      this.render();
    } else {
      info('Failed to delete workspace, Please try again.');
    }
  }

  /**
   * ## Warn
   * !! Codes below `$send` are not accessible.
   *
   * ## Reason
   * 1. New window causes popup page to be unfocused.
   * 2. Unfocused popup is basically deleted.
   * 3. Click plugin button again creates a new popup page.
   */
  open(workspace: Workspace): Promise<OpenWorkspaceResponse> {
    return $send<OpenWorkspaceRequest>({
      action: Action.OpenWorkspace,
      workspaceId: workspace.id,
    });
  }

  // Remove tab from group
  async removeTab(workspaceId: string, tabId: number) {
    const response = await $send<RemoveTabRequest>({
      action: Action.RemoveTab,
      workspaceId,
      tabId,
    }).fallbackWithDialog('__func__: Error removing tab');

    if (response === Sym.Reject) {
      return;
    }

    if (response.success) {
      await this.load();
      this.render();
    } else {
      info('Failed to remove tab, Please try again.');
    }
  }

  // Move tab between groups
  async moveTab(fromId: string, toId: string, tabId: number) {
    const response = await $send<MoveTabRequest>({
      action: Action.MoveTab,
      fromWorkspaceId: fromId,
      toWorkspaceId: toId,
      tabId,
    }).fallbackWithDialog('__func__: Error moving tab');

    if (response === Sym.Reject) {
      return;
    }

    if (response.success) {
      await this.load();
      this.render();
    } else {
      info('Failed to move tab, Please try again.');
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => (window.popup = new PopupPage()));

declare global {
  interface Window {
    popup: PopupPage;
  }
}
