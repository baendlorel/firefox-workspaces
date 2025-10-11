import { $sha256, $tdtDashed } from '@/lib/utils.js';
import { store } from '@/lib/storage.js';
import { $id, div, h } from '@/lib/dom.js';
import { i } from '@/lib/polyfilled-api.js';

interface EncryptedWorkspace {
  id: string;
  name: string;
  password: string; // SHA-256 hash
}

class Exporter {
  // Data
  private readonly encryptedWorkspaces: EncryptedWorkspace[] = [];
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
    this.encryptedWorkspaces.push(
      ...workspaces
        .filter((w) => w.password && w.password.trim() !== '')
        .map((w) => ({ id: w.id, name: w.name, password: w.password }))
    );

    // If there are encrypted workspaces, show password form
    if (this.encryptedWorkspaces.length > 0 && this.passwordSection && this.passwordForm) {
      this.passwordSection.style.display = 'block';
      this.renderPasswordForm();
    }

    // Setup export button
    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => this.handleExport());
    }
  }

  /**
   * Render password input form for encrypted workspaces
   */
  private renderPasswordForm() {
    this.passwordForm.textContent = '';
    this.passwordInputs.clear();

    for (const workspace of this.encryptedWorkspaces) {
      const input = h('input', { class: 'password-input', type: 'password' });
      input.dataset.workspaceId = workspace.id;
      input.placeholder = 'Enter password...';

      // Cache input element for later access
      this.passwordInputs.set(workspace.id, input);

      const item = div('password-item', [h('label', 'password-label', workspace.name), input]);

      // Add hint if available
      const ws = this.allWorkspaces.find((w) => w.id === workspace.id);
      if (ws && ws.passpeek) {
        const hint = div('password-hint', i('dialog.password-hint.message', ws.passpeek));
        item.appendChild(hint);
      }

      this.passwordForm.appendChild(item);
    }
  }

  /**
   * Handle export button click
   */
  private async handleExport() {
    // Clear previous errors
    this.clearErrors();

    // If no encrypted workspaces, export directly
    if (this.encryptedWorkspaces.length === 0) {
      await this.performExport([]);
      return;
    }

    // Validate passwords
    const validationResults = await this.validatePasswords();

    // Check if all passwords are correct
    const allValid = validationResults.every((v) => v.valid);
    const invalidCount = validationResults.filter((v) => !v.valid).length;

    if (!allValid) {
      this.showError(
        invalidCount === 1
          ? 'Password incorrect. Please try again.'
          : `${invalidCount} passwords incorrect. Please try again.`
      );
      return;
    }

    // All passwords correct, perform export
    await this.performExport([]);
  }

  /**
   * Clear all error states
   */
  private clearErrors() {
    this.passwordInputs.forEach((input) => input.classList.remove('error'));
    this.statusMessage.textContent = '';
    this.statusMessage.style.color = '';
  }

  /**
   * Validate all password inputs
   */
  private async validatePasswords(): Promise<
    Array<{ id: string; input: HTMLInputElement; valid: boolean }>
  > {
    const validations: Array<{ id: string; input: HTMLInputElement; valid: boolean }> = [];

    for (const encrypted of this.encryptedWorkspaces) {
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
   */
  private async performExport(excludeIds: string[]) {
    try {
      this.exportBtn.disabled = true;
      this.showInfo('Preparing export...', '#2da191');

      // Get data from storage
      const persist = await store.localGet('workspaces', 'settings');

      // Filter out excluded workspaces (if any had wrong passwords)
      const exportData: ExportData = {
        workspaces: persist.workspaces.filter((w) => !excludeIds.includes(w.id)),
        settings: persist.settings,
        timestamp: persist.timestamp,
      };

      // Create and download JSON file
      const text = JSON.stringify(exportData, null, 2);
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = h('a', { href: url, download: `kskb-workspaces-${$tdtDashed()}.json` });
      a.click();
      URL.revokeObjectURL(url);

      this.showInfo('Export successful!', '#4ade80');

      // Close window after 1.5 seconds
      setTimeout(() => {
        browser.tabs.getCurrent().then((tab) => {
          if (tab?.id !== undefined) {
            browser.tabs.remove(tab.id);
          }
        });
      }, 1500);
    } catch (error) {
      this.showError('Export failed: ' + (error as Error).message);
      this.exportBtn.disabled = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new Exporter());
