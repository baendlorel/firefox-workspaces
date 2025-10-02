import { Action } from '@/lib/consts.js';
import { $lsget, $lsset, $send } from '@/lib/ext-apis.js';
import { Workspace } from '@/lib/workspace.js';

class PopupService {
  async getWorkspaceOfCurrentWindow() {
    const currentWindow = await browser.windows.getCurrent();
    const workspaces = await $lsget('workspaces');
    return workspaces.find((w) => w.windowId === currentWindow.id);
  }

  /**
   * Save workspace (create or update)
   */
  async save(formData: WorkspaceFormData) {
    const workspaces = await $lsget('workspaces');

    const newWorkspace = Workspace.from(formData);
    if (workspaces.every((w) => w.id !== newWorkspace.id)) {
      workspaces.push(newWorkspace);
    }

    await $lsset({ workspaces });

    if (formData.id === null && formData.tabs.length > 0) {
      await this.open(newWorkspace);
    }
  }

  // Delete workspace
  async delete(workspace: WorkspacePlain) {
    const workspaces = await $lsget('workspaces');
    const index = workspaces.findIndex((w) => w.id === workspace.id);
    if (index === -1) {
      workspaces.splice(index, 1);
    }
    await $lsset({ workspaces });
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
  open(workspace: WorkspacePlain): Promise<OpenResponse> {
    return $send<OpenRequest>({
      action: Action.Open,
      workspace,
    });
  }
}

const popupService = new PopupService();
export default popupService;
