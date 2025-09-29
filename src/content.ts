// Content script for Workspaces extension
// This script runs on all web pages to provide additional functionality
import { Action, Consts } from './lib/consts.js';
import { $query } from './lib/dom.js';
import { $send } from './lib/ext-apis.js';

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
      this.injectStyles();
    }

    // Listen for messages from popup or background
    setupMessageListener() {
      browser.runtime.onMessage.addListener((message, _sender, respond) => {
        switch (message.action) {
          case 'getPageInfo':
            respond({
              title: document.title,
              url: window.location.href,
              favicon: this.getFavicon(),
            });
            break;

          case 'highlightPage':
            this.highlightPage(message.color);
            break;

          case 'removeHighlight':
            this.removeHighlight();
            break;

          default:
            break;
        }
      });
    }

    // Inject custom styles for workspace features
    injectStyles() {
      const style = document.createElement('style');
      style.textContent = `
        /* Workspaces page highlighting */
        .wb-highlight {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 4px !important;
          z-index: 999999 !important;
          background: linear-gradient(90deg, var(--wg-color, #667eea), transparent) !important;
          pointer-events: none !important;
          transition: opacity 0.3s ease !important;
        }
        
        .wb-indicator {
          position: fixed !important;
          top: 8px !important;
          right: 8px !important;
          background: var(--wg-color, #667eea) !important;
          color: white !important;
          padding: 4px 8px !important;
          border-radius: 12px !important;
          font-size: 11px !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          z-index: 999998 !important;
          opacity: 0.8 !important;
          pointer-events: none !important;
          transition: opacity 0.3s ease !important;
        }
        
        .wb-indicator:hover {
          opacity: 1 !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Get page favicon
    getFavicon() {
      const favicon =
        $query<HTMLLinkElement>('link[rel="icon"]') ||
        $query<HTMLLinkElement>('link[rel="shortcut icon"]') ||
        $query<HTMLLinkElement>('link[rel="apple-touch-icon"]');

      if (favicon) {
        return favicon.href;
      }

      // Fallback to default favicon path
      return `${window.location.protocol}//${window.location.host}/favicon.ico`;
    }

    // Highlight page with workspace color
    highlightPage(color: string) {
      this.removeHighlight();

      // Create highlight bar
      const highlight = document.createElement('div');
      highlight.className = 'wb-highlight';
      highlight.style.setProperty('--wg-color', color);
      document.body.appendChild(highlight);

      // Create indicator
      const indicator = document.createElement('div');
      indicator.className = 'wb-indicator';
      indicator.style.setProperty('--wg-color', color);
      indicator.textContent = 'Workspaces';
      document.body.appendChild(indicator);

      // Auto-remove after delay
      setTimeout(() => {
        this.removeHighlight();
      }, 3000);
    }

    // Remove page highlighting
    removeHighlight() {
      const existing = document.querySelectorAll('.wb-highlight, .wb-indicator');
      existing.forEach((el) => el.remove());
    }

    // Check if page belongs to a workspace
    async checkWorkspacesMembership() {
      try {
        const response = await $send<CheckPageInGroupsRequest>({
          action: Action.CheckPageInGroups,
          url: window.location.href,
        });

        if (response.success && response.groups.length > 0) {
          // Page belongs to work groups, show indicator
          this.showWorkspaceIndicator(response.groups);
        }
      } catch (error) {
        console.log('Could not check workspace membership:', error);
      }
    }

    // Show indicator for workspace membership
    showWorkspaceIndicator(workspaces: Workspace[]): void {
      if (workspaces.length === 0) {
        return;
      }

      const primary = workspaces[0]; // Use first group's color
      this.highlightPage(primary.color);

      // Update indicator text with group info
      setTimeout(() => {
        const indicator = $query('.wb-indicator');
        if (indicator) {
          indicator.textContent =
            workspaces.length === 1 ? primary.name : `${workspaces.length} Workspaces`;
        }
      }, 100);
    }

    // Utility to create notification
    showNotification(message: string, type: string = 'info') {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : '#4caf50'};
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 999999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transition: opacity 0.3s ease;
      `;
      notification.textContent = message;
      document.body.appendChild(notification);

      // Auto-remove
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
  }

  // Initialize content script
  const workspacesContent = new WorkspacesContent();

  // Check workspace membership on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => workspacesContent.checkWorkspacesMembership(), 1000);
    });
  } else {
    setTimeout(() => workspacesContent.checkWorkspacesMembership(), 1000);
  }

  // Re-check on navigation (for SPAs)
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(() => workspacesContent.checkWorkspacesMembership(), 1000);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
