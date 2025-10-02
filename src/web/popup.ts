import './css/theme.css';
import './css/main.css';
import './css/workspace.css';
import './css/form.css';
import '@/lib/promise-ext.js';

import { createView } from './view.js';

import { danger } from './components/dialog/alerts.js';

Promise.dialogDanger = danger;

// Popup JavaScript for Workspaces Manager
class PopupPage {
  constructor() {
    logger.info('PopupPage Created');
    const main = createView();
    main.emit('render-list');
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.popup = new PopupPage();
});

declare global {
  interface Window {
    popup: PopupPage;
  }
}
