import './css/theme.css';
import './css/main.css';
import './css/workspace.css';
import './css/form.css';
import '@/lib/promise-ext.js';

import { createView } from './view.js';
import popupService from './popup.service.js';

import { danger } from './components/dialog/alerts.js';

Promise.dialogDanger = danger;

// Popup JavaScript for Workspaces Manager
class PopupPage {
  get isWorkspacePopupPage() {
    return true;
  }

  constructor() {
    logger.info('PopupPage Created');
  }

  async init() {
    const main = createView();
    await popupService.load();
    main.emit('render-list', popupService.workspaces, popupService.activated);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.popup = new PopupPage();
  window.popup.init();
});

declare global {
  interface Window {
    popup: PopupPage;
  }
}
