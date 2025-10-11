import { $sha256, $tdtDashed } from '@/lib/utils.js';
import { store } from '@/lib/storage.js';
import { $id, div, h } from '@/lib/dom.js';
import { i } from '@/lib/polyfilled-api.js';

class Exporter {
  // Data
  private readonly encrypted: Workspace[] = [];
  private readonly allWorkspaces: Workspace[] = [];

  // DOM elements
  private readonly passwordSection: HTMLElement;
  private readonly passwordForm: HTMLElement;
  private readonly exportBtn: HTMLButtonElement;
  private readonly statusMessage: HTMLElement;

  // Password input elements map for efficient access
  private readonly passwordInputs = new Map<string, HTMLInputElement>();

  constructor() {
    this.passwordSection = $id('password-section');
    this.passwordForm = $id('password-form');
    this.exportBtn = $id('export-btn') as HTMLButtonElement;
    this.statusMessage = $id('status-message');
    this.init();
  }

  /**
   * Initialize the exporter, load data and setup UI
   */
  private async init() {
    // Cache DOM elements

    // Load workspaces from storage
    const { workspaces } = await store.localGet('workspaces');
    this.allWorkspaces.push(...workspaces);

    // Find encrypted workspaces
    this.encrypted.push(...workspaces.filter((w) => w.password && w.password.trim() !== ''));

    // If there are encrypted workspaces, show password form
    if (this.encrypted.length > 0 && this.passwordSection && this.passwordForm) {
      this.passwordSection.style.display = 'block';
      this.renderForm();
    }

    // Setup export button
    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => this.handleExport());
    }
  }

  /**
   * Render password input form for encrypted workspaces
   */
  private renderForm() {
    this.passwordForm.textContent = '';
    this.passwordInputs.clear();

    for (let j = 0; j < this.encrypted.length; j++) {
      const workspace = this.encrypted[j];
      const input = h('input', {
        class: 'password-input',
        type: 'password',
        placeholder: i('dialog.password-hint.message', workspace.passpeek),
      });

      this.passwordInputs.set(workspace.id, input);
      this.passwordForm.appendChild(
        div('password-item', [h('label', 'password-label', workspace.name), input])
      );
    }
  }

  /**
   * Handle export button click
   */
  private async handleExport() {
    // Clear previous errors
    this.clearErrors();

    // If no encrypted workspaces, export directly
    if (this.encrypted.length === 0) {
      await this.performExport([]);
      return;
    }

    const validationResults = await this.validate();

    // Separate valid and invalid workspaces
    const invalidWorkspaces = validationResults.filter((v) => !v.valid);
    const excludeIds = invalidWorkspaces.map((v) => v.id);
    const invalidWorkspaceNames = invalidWorkspaces.map((v) => {
      const ws = this.encrypted.find((w) => w.id === v.id);
      return ws?.name || v.id;
    });

    // If all passwords are correct, export all
    if (invalidWorkspaces.length === 0) {
      await this.performExport([]);
      return;
    }

    this.showError(i('dialog.export.password-incorrect', invalidWorkspaceNames.join(', ')));
    await this.performExport(excludeIds);
  }

  /**
   * Clear all error states
   */
  private clearErrors() {
    this.passwordInputs.forEach((input) => input.classList.remove('error'));
    this.statusMessage.textContent = '';
    this.statusMessage.style.color = '';
  }

  private async validate(): Promise<
    Array<{ id: string; input: HTMLInputElement; valid: boolean }>
  > {
    const validations: Array<{ id: string; input: HTMLInputElement; valid: boolean }> = [];

    for (const encrypted of this.encrypted) {
      const input = this.passwordInputs.get(encrypted.id);
      if (!input) continue;

      const password = input.value.trim();
      if (password === '') {
        input.classList.add('error');
        validations.push({ id: encrypted.id, input, valid: false });
        continue;
      }

      const hash = await $sha256(password);
      const valid = hash === encrypted.password;

      if (!valid) {
        input.classList.add('error');
      }

      validations.push({ id: encrypted.id, input, valid });
    }

    return validations;
  }

  /**
   * Show error message
   */
  private showError(message: string) {
    this.statusMessage.textContent = message;
    this.statusMessage.style.color = '#ff6b6b';
  }

  /**
   * Show info message
   */
  private showInfo(message: string, color: string = '#2da191') {
    this.statusMessage.textContent = message;
    this.statusMessage.style.color = color;
  }

  /**
   * Perform the actual export operation
   * @param excludeIds - IDs of workspaces to exclude (incorrect passwords)
   */
  private async performExport(excludeIds: string[]) {
    try {
      this.exportBtn.disabled = true;
      this.showInfo(i('dialog.export.preparing'), '#2da191');

      // Get data from storage
      const persist = await store.localGet('workspaces', 'settings');

      // Filter out excluded workspaces (if any had wrong passwords)
      const exportData: ExportData = {
        workspaces: persist.workspaces.filter((w) => !excludeIds.includes(w.id)),
        settings: persist.settings,
        timestamp: persist.timestamp,
      };

      // Create and download JSON file
      // $ Note that NaN -> null in JSON.stringify
      const text = JSON.stringify(exportData, null, 2);
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = h('a', { href: url, download: `kskb-workspaces-${$tdtDashed()}.json` });
      a.click();
      URL.revokeObjectURL(url);

      // Show success message
      if (excludeIds.length === 0) {
        // All workspaces exported successfully
        this.showInfo(i('dialog.export.success-full'), '#4ade80');
      } else {
        // Partial export - some workspaces skipped
        const message = i('dialog.export.success-partial', excludeIds.length);
        this.showInfo(message, '#f59e0b'); // Orange color for warning
      }

      // Close window after delay if fully successful, otherwise keep open for retry
      if (excludeIds.length === 0) {
        setTimeout(() => {
          browser.tabs.getCurrent().then((tab) => {
            if (tab?.id !== undefined) {
              browser.tabs.remove(tab.id);
            }
          });
        }, 1500);
      } else {
        // Re-enable button for retry
        this.exportBtn.disabled = false;
      }
    } catch (error) {
      this.showError(i('dialog.export.failed', (error as Error).message));
      this.exportBtn.disabled = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new Exporter());
