import { $sha256, $tdtDashed } from '@/lib/utils.js';
import { store } from '@/lib/storage.js';

interface EncryptedWorkspace {
  id: string;
  name: string;
  password: string; // SHA-256 hash
}

let encryptedWorkspaces: EncryptedWorkspace[] = [];
let allWorkspaces: Workspace[] = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Load workspaces from storage
  const { workspaces } = await store.localGet('workspaces');
  allWorkspaces = workspaces;

  // Find encrypted workspaces
  encryptedWorkspaces = workspaces
    .filter((w) => w.password && w.password.trim() !== '')
    .map((w) => ({ id: w.id, name: w.name, password: w.password }));

  // If there are encrypted workspaces, show password form
  if (encryptedWorkspaces.length > 0) {
    const passwordSection = document.getElementById('password-section');
    const passwordForm = document.getElementById('password-form');

    if (passwordSection && passwordForm) {
      passwordSection.style.display = 'block';
      renderPasswordForm(passwordForm);
    }
  }

  // Setup export button
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', handleExport);
  }
});

function renderPasswordForm(form: HTMLElement) {
  form.innerHTML = '';

  for (const workspace of encryptedWorkspaces) {
    const item = document.createElement('div');
    item.className = 'password-item';

    const label = document.createElement('label');
    label.className = 'password-label';
    label.textContent = workspace.name;
    item.appendChild(label);

    const input = document.createElement('input');
    input.type = 'password';
    input.className = 'password-input';
    input.placeholder = 'Enter password...';
    input.dataset.workspaceId = workspace.id;
    item.appendChild(input);

    // Add hint if available
    const ws = allWorkspaces.find((w) => w.id === workspace.id);
    if (ws && ws.passpeek) {
      const hint = document.createElement('div');
      hint.className = 'password-hint';
      hint.textContent = `Hint: starts with "${ws.passpeek}"`;
      item.appendChild(hint);
    }

    form.appendChild(item);
  }
}

async function handleExport() {
  const statusMessage = document.getElementById('status-message');
  const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;

  if (!statusMessage || !exportBtn) return;

  // Clear previous errors
  const inputs = document.querySelectorAll('.password-input');
  inputs.forEach((input) => input.classList.remove('error'));
  statusMessage.textContent = '';
  statusMessage.style.color = '';

  // If no encrypted workspaces, export directly
  if (encryptedWorkspaces.length === 0) {
    await performExport([]);
    return;
  }

  // Validate passwords
  const passwordValidations: Array<{ id: string; input: HTMLInputElement; valid: boolean }> = [];

  for (const encrypted of encryptedWorkspaces) {
    const input = document.querySelector(
      `.password-input[data-workspace-id="${encrypted.id}"]`
    ) as HTMLInputElement;

    if (!input) continue;

    const password = input.value.trim();
    if (password === '') {
      input.classList.add('error');
      passwordValidations.push({ id: encrypted.id, input, valid: false });
      continue;
    }

    const hash = await $sha256(password);
    const valid = hash === encrypted.password;

    if (!valid) {
      input.classList.add('error');
    }

    passwordValidations.push({ id: encrypted.id, input, valid });
  }

  // Check if all passwords are correct
  const allValid = passwordValidations.every((v) => v.valid);
  const invalidCount = passwordValidations.filter((v) => !v.valid).length;

  if (!allValid) {
    statusMessage.textContent =
      invalidCount === 1
        ? 'Password incorrect. Please try again.'
        : `${invalidCount} passwords incorrect. Please try again.`;
    statusMessage.style.color = '#ff6b6b';
    return;
  }

  // All passwords correct, perform export
  const excludeIds: string[] = []; // No exclusions since all passwords are correct
  await performExport(excludeIds);
}

async function performExport(excludeIds: string[]) {
  const statusMessage = document.getElementById('status-message');
  const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;

  if (!statusMessage || !exportBtn) return;

  try {
    exportBtn.disabled = true;
    statusMessage.textContent = 'Preparing export...';
    statusMessage.style.color = '#2da191';

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
    const a = document.createElement('a');
    a.href = url;
    a.download = `kskb-workspaces-${$tdtDashed()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    statusMessage.textContent = 'Export successful!';
    statusMessage.style.color = '#4ade80';

    // Close window after 1.5 seconds
    setTimeout(() => {
      const cur = browser.tabs.getCurrent();
      cur.then((tab) => {
        if (tab?.id !== undefined) {
          browser.tabs.remove(tab.id);
        }
      });
    }, 1500);
  } catch (error) {
    statusMessage.textContent = 'Export failed: ' + (error as Error).message;
    statusMessage.style.color = '#ff4444';
    exportBtn.disabled = false;
  }
}
