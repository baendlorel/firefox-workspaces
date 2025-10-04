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
      browser.runtime.onMessage.addListener(async (message: any) => {
        if (message.action === Action.TriggerImport) {
          this.openFileSelector();
          return { succ: true, from: 'content' };
        }
        return { succ: false, from: 'content' };
      });
    }

    private openFileSelector() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.style.display = 'none';

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          return;
        }

        const text = await file.text();
        const message: FileImportDataRequest = {
          action: Action.FileImportData,
          succ: true,
          data: text,
        };
        await browser.runtime.sendMessage(message);
      };

      input.oncancel = () => input.remove();

      document.body.appendChild(input);
      input.click();
    }
  }

  new WorkspacesContent();
})();
