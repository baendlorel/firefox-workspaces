import { Action } from '@/lib/consts.js';
import { $windowWorkspace, $send } from '@/lib/ext-apis.js';
import { $objectHash } from '@/lib/utils.js';
import { store } from '@/lib/storage.js';
import { createWorkspace } from '@/lib/workspace.js';

class PopupService {
  async getWorkspaceOfCurrentWindow() {
    const currentWindow = await browser.windows.getCurrent();
    return $windowWorkspace(currentWindow.id);
  }

  /**
   * Save workspace (create or update)
   */
  async save(formData: WorkspaceFormData) {
    const { workspaces } = await store.localGet('workspaces');

    // handle create
    if (formData.id === null) {
      const newWorkspace = createWorkspace(formData);
      workspaces.push(newWorkspace);

      await store.localPersistSet({ workspaces });

      if (formData.tabs.length > 0) {
        await this.open(newWorkspace);
      }
      return;
    }

    const exists = workspaces.find((w) => w.id === formData.id);
    if (!exists) {
      logger.error('Workspace(will non-null id) to update not found:', formData.id);
      return;
    }

    exists.name = formData.name;
    exists.color = formData.color;
    exists.tabs = formData.tabs;
    await store.localPersistSet({ workspaces });
  }

  // Delete workspace
  async delete(workspace: Workspace) {
    const { workspaces } = await store.localGet('workspaces');
    const index = workspaces.findIndex((w) => w.id === workspace.id);
    if (index !== -1) {
      workspaces.splice(index, 1);
      await store.localPersistSet({ workspaces });
    }
  }

  /**
   * !! Codes below `$send` are not accessible.
   *
   * Reason:
   * 1. New window causes popup page to be unfocused.
   * 2. Unfocused popup is basically deleted.
   * 3. Click plugin button again creates a new popup page.
   */
  open(workspace: Workspace) {
    return $send<OpenRequest>({
      action: Action.Open,
      workspace,
    });
  }

  async getExportData(): Promise<ExportData> {
    // & Let background to save the cached tabs into storage.local's persist part
    await $send<ExportRequest>({ action: Action.Export });
    const persist = await store.localGet('workspaces', 'settings');
    return { ...persist, hash: $objectHash(persist) };
  }
}

const popupService = new PopupService();
export default popupService;
