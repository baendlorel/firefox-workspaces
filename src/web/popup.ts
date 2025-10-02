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
    logger.verbose('PopupPage initializing');
    const main = createView();
    popupService.load().then(() => main.emit('render-list'));

    if (__IS_DEV__) {
      import('./__mock__/toolbar.js');
      return;
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
