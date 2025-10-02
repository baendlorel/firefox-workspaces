import { Action, Sym } from '@/lib/consts.js';
import { $send, i } from '@/lib/ext-apis.js';
import { IndexedWorkspace, Workspace } from '@/lib/workspace.js';

import { info } from './components/dialog/alerts.js';

class PopupService {
  readonly workspaces: Workspace[] = [];
  readonly activated: string[] = []; // Track active workspace IDs

  async getWorkspaceOfCurrentWindow() {
    const currentWindow = await browser.windows.getCurrent();
    return this.workspaces.find((w) => w.windowId === currentWindow.id);
  }

  get isEmpty() {
    return this.workspaces.length === 0;
  }

  // Load work groups from background
  async load() {
    const response = await $send<GetRequest>({
      action: Action.Get,
    }).fallbackWithDialog(i('failedToLoadWorkGroups'));

    if (response === Sym.Reject || !response.success) {
      return;
    }

    const loaded = response.data ?? [];
    this.workspaces.length = 0;
    for (let i = 0; i < loaded.length; i++) {
      const w = loaded[i];
      this.workspaces.push(IndexedWorkspace.load(NaN, w));
    }

    // Update active workspaces
    this.activated.length = 0;
    if (response.activated) {
      this.activated.push(...response.activated);
    }
  }

  // Save workspace (create or update)
  async save(formData: WorkspaceFormData) {
    const response = await $send<SaveRequest>({
      action: Action.Save,
      data: { id: formData.id, name: formData.name, color: formData.color, tabs: formData.tabs },
    }).fallbackWithDialog('__func__: Failed saving workspace');

    if (response === Sym.Reject) {
      return;
    }

    if (!response.success) {
      info(i('failedToSaveWorkspace'));
      logger.error('Save workspace failed', response);
    }

    await this.load();

    // If creating a workspace with tabs, open it automatically
    if (formData.id === null && formData.tabs.length > 0) {
      await this.open(response.data);
    }
  }

  // Delete workspace
  async delete(workspace: Workspace) {
    const response = await $send<DeleteRequest>({
      action: Action.Delete,
      id: workspace.id,
    }).fallbackWithDialog('__func__: Error deleting workspace');

    if (response === Sym.Reject) {
      return;
    }

    if (!response.success) {
      info(i('failedToDeleteWorkspace'));
      return;
    }

    await this.load();
    // ?? this.render();
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
  open(workspace: Workspace): Promise<OpenResponse> {
    return $send<OpenRequest>({
      action: Action.Open,
      workspaceId: workspace.id,
    });
  }
}

const popupService = new PopupService();
export default popupService;
