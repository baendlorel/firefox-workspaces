import { $windowWorkspace, $send } from '@/lib/polyfilled-api.js';
import { $objectHash, $tdtDashed, $sha256 } from '@/lib/utils.js';
import { store } from '@/lib/storage.js';
import { createWorkspace } from '@/lib/workspace.js';
import { compressToBase64 } from 'lz-string';

class PopupService {
  async getWorkspaceOfCurrentWindow() {
    const currentWindow = await browser.windows.getCurrent();
    return $windowWorkspace(currentWindow.id);
  }

  /**
   * Verify password for a workspace
   * Returns:
   *  - 'locked': workspace is locked due to too many failed attempts
   *  - 'incorrect': password is incorrect
   *  - 'correct': password is correct
   */
  async verifyPassword(
    workspace: Workspace,
    password: string
  ): Promise<'locked' | 'incorrect' | 'correct'> {
    // Check if workspace is locked (NaN < any number is false, so NaN lockUntil won't lock)
    if (Date.now() < workspace.lockUntil) {
      return 'locked';
    }

    const passwordHash = await $sha256(password);

    if (passwordHash === workspace.password) {
      // Reset failed attempts on successful login (use NaN for "no attempts")
      if (!isNaN(workspace.failedAttempts) || !isNaN(workspace.lockUntil)) {
        workspace.failedAttempts = NaN;
        workspace.lockUntil = NaN;
        const { workspaces } = await store.localGet('workspaces');
        const idx = workspaces.findIndex((w) => w.id === workspace.id);
        if (idx !== -1) {
          workspaces[idx] = workspace;
          await store.localPersistSet({ workspaces });
        }
      }
      return 'correct';
    }

    // Increment failed attempts (treat NaN as 0)
    const failedAttempts = (isNaN(workspace.failedAttempts) ? 0 : workspace.failedAttempts) + 1;
    workspace.failedAttempts = failedAttempts;

    // Lock after 3 failed attempts
    if (failedAttempts >= 3) {
      workspace.lockUntil = Date.now() + 60000; // Lock for 60 seconds
    }

    // Update workspace in storage
    const { workspaces } = await store.localGet('workspaces');
    const idx = workspaces.findIndex((w) => w.id === workspace.id);
    if (idx !== -1) {
      workspaces[idx] = workspace;
      await store.localPersistSet({ workspaces });
    }

    return 'incorrect';
  }

  /**
   * Get remaining lock time in seconds
   */
  getRemainingLockTime(workspace: Workspace): number {
    // NaN comparison returns false, so NaN lockUntil returns 0
    if (Date.now() >= workspace.lockUntil) {
      return 0;
    }
    return Math.ceil((workspace.lockUntil - Date.now()) / 1000);
  }

  /**
   * Save workspace (create or update)
   */
  async save(formData: WorkspaceFormData) {
    const { workspaces } = await store.localGet('workspaces');

    // handle create
    if (formData.id === null) {
      const newWorkspace = createWorkspace(formData);
      // Password fields are already initialized in createWorkspace
      // formData.password will be hashed and set via createWorkspace
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

    // Update password fields (formData.password is always a string, empty = no password)
    if (formData.password !== '') {
      exists.password = formData.password;
      exists.passpeek = formData.passpeek;
      // Reset failed attempts when password is changed
      exists.failedAttempts = NaN;
      exists.lockUntil = NaN;
    } else {
      // Remove password if empty string is provided
      exists.password = '';
      exists.passpeek = '';
      exists.failedAttempts = NaN;
      exists.lockUntil = NaN;
    }

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

  async exportData() {
    // & Let background to save the cached tabs into storage.local's persist part
    await $send<ExportRequest>({ action: Action.Export });
    const persist = await store.localGet('workspaces', 'settings');

    // Create and download JSON file
    const text = JSON.stringify({ ...persist, hash: $objectHash(persist) }, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kskb-workspaces-${$tdtDashed()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logger.info('Exported data length:', text.length, 'compressed', compressToBase64(text).length);
  }
}

const popupService = new PopupService();
export default popupService;
