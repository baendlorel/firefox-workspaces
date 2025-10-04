// Content script for Workspaces extension
// This script runs on all web pages to provide additional functionality
import { Consts, Action } from './lib/consts.js';

(function () {
  'use strict';

  // Prevent multiple injections
  if (Reflect.get(window, Consts.InjectionFlag)) {
    return;
  }

  Reflect.set(window, Consts.InjectionFlag, true);

  class WorkspacesContent {
    constructor() {
      this.setupMessageListener();
    }

    private setupMessageListener() {
      const handler = async (message: OpenFileInputRequest) =>
        new Promise((resolve) => {
          if (message.action === Action.OpenFileInput) {
            this.openFileSelector().then((text) => resolve({ succ: true, text }));
          } else {
            resolve({ succ: false, text: null });
          }
        });

      browser.runtime.onMessage.addListener(handler);
    }

    private openFileSelector() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.style.display = 'none';
      input.oncancel = () => input.remove();

      return new Promise((resolve) => {
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) {
            return;
          }

          // todo 测试导出
          file.text().then(resolve);
        };
        document.body.appendChild(input);
        input.click();
      });
    }
  }

  new WorkspacesContent();
})();
