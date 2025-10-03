import { Action } from '@/lib/consts.js';
import { $findWorkspaceByWindowId, $lsget, $lsset, $send } from '@/lib/ext-apis.js';
import { $objectHash } from '@/lib/utils.js';
import { createWorkspace } from '@/lib/workspace.js';

class PopupService {
  async getWorkspaceOfCurrentWindow() {
    const currentWindow = await browser.windows.getCurrent();
    return $findWorkspaceByWindowId(currentWindow.id);
  }

  /**
   * Save workspace (create or update)
   */
  async save(formData: WorkspaceFormData) {
    const { persist } = await $lsget('persist');
    const workspaces = persist.workspaces;

    const newWorkspace = createWorkspace(formData);
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
    const { workspaces } = await $lsget('workspaces');
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

  async getExportData(): Promise<ExportData> {
    const state = await $lsget();
    return { ...state, hash: $objectHash(state) };
  }
}

const popupService = new PopupService();
export default popupService;
