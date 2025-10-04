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
      browser.runtime.onMessage.addListener(async (message: OpenFileInputRequest) => {
        if (message.action === Action.OpenFileInput) {
          this.openFileSelector(message.requestId);
          return { succ: true, from: 'content' };
        }
        return { succ: false, from: 'content' };
      });
    }

    private openFileSelector(requestId: string) {
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

          // todo 看看能不能包一个大promise直接包回去
          const text = await file.text();
          const message: ReturnFileDataRequest = {
            action: Action.ReturnFileData,
            succ: true,
            data: text,
            requestId,
          };
          await browser.runtime.sendMessage(message);
        };
        document.body.appendChild(input);
        input.click();
      });
    }
  }

  new WorkspacesContent();
})();
