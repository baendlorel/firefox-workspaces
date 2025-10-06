import { createView } from './view.js';

class Popup {
  emit: ReturnType<typeof createView>['emit'];
  on: ReturnType<typeof createView>['on'];
  constructor() {
    const view = createView();
    this.emit = view.emit;
    this.on = view.on;
  }
}

document.addEventListener('DOMContentLoaded', () => (window.popup = new Popup()));

declare global {
  interface Window {
    popup: Popup;
  }
}
