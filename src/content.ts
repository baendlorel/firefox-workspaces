// Content script for Workspaces extension
// This script runs on all web pages to provide additional functionality
import '@/lib/promise-ext.js';
import { Action, Consts } from './lib/consts.js';

(function () {
  'use strict';

  // Prevent multiple injections
  if (Reflect.get(window, Consts.InjectionFlag)) {
    return;
  }

  Reflect.set(window, Consts.InjectionFlag, true);

  // Content script for handling page-specific features
  class WorkspacesContent {
    constructor() {
      this.init();
    }
    init() {
      this.setupMessageListener();
    }

    // Listen for messages from popup or background
    setupMessageListener() {
      browser.runtime.onMessage.addListener((message, _sender, respond) => {
        switch (message.action) {
          case Action.Import:
            this.showFileInput();
            break;
          default:
            break;
        }
      });
    }

    // Show file picker and handle import
    showFileInput() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.style.display = 'none';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          this.notification('Import failed. No file selected.');
          return;
        }
        const reader = new FileReader();
        reader.onload = async () => {
          if (reader.result === null) {
            this.notification('Failed to read file, got null.');
            return;
          }

          let data: WorkspaceState;

          try {
            const str =
              reader.result instanceof ArrayBuffer
                ? new TextDecoder().decode(reader.result)
                : reader.result;
            data = JSON.parse(str);
          } catch (e) {
            this.notification('Invalid file format.');
            return;
          }

          // Send to background for validation & import
          const response = await browser.runtime.sendMessage({
            action: Action.Import,
            data,
          });

          if (response.success) {
            this.notification('Import succeeded!');
          } else {
            this.notification('Import failed: ' + (response.message || 'Unknown error'));
          }
        };
        reader.readAsText(file);
      };
      document.body.appendChild(input);
      input.click();
    }

    // Utility to create notification
    notification(message: string) {
      browser.notifications.create({
        type: 'basic',
        title: 'Import',
        message,
      });
    }
  }
})();
