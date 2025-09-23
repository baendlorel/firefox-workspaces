// Content script for Workspaces extension
// This script runs on all web pages to provide additional functionality

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.workspacesContentLoaded) {
    return;
  }
  window.workspacesContentLoaded = true;

  // Content script for handling page-specific features
  class WorkspacesContent {
    constructor() {
      this.init();
    }

    init() {
      this.setupMessageListener();
      this.injectStyles();
      this.setupContextMenu();
    }

    // Listen for messages from popup or background
    setupMessageListener() {
      browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.action) {
          case 'getPageInfo':
            sendResponse({
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

    // Inject custom styles for work group features
    injectStyles() {
      const style = document.createElement('style');
      style.textContent = `
        /* Workspaces page highlighting */
        .work-group-highlight {
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
        
        .work-group-indicator {
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
        
        .work-group-indicator:hover {
          opacity: 1 !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Setup context menu enhancements
    setupContextMenu() {
      // Add context menu listener for better integration
      document.addEventListener('contextmenu', (event) => {
        // Store the context for potential use by extension
        this.lastContextElement = event.target;
        this.lastContextPosition = { x: event.clientX, y: event.clientY };
      });
    }

    // Get page favicon
    getFavicon() {
      const favicon =
        document.querySelector('link[rel="icon"]') ||
        document.querySelector('link[rel="shortcut icon"]') ||
        document.querySelector('link[rel="apple-touch-icon"]');

      if (favicon) {
        return favicon.href;
      }

      // Fallback to default favicon path
      return `${window.location.protocol}//${window.location.host}/favicon.ico`;
    }

    // Highlight page with work group color
    highlightPage(color = '#667eea') {
      this.removeHighlight();

      // Create highlight bar
      const highlight = document.createElement('div');
      highlight.className = 'work-group-highlight';
      highlight.style.setProperty('--wg-color', color);
      document.body.appendChild(highlight);

      // Create indicator
      const indicator = document.createElement('div');
      indicator.className = 'work-group-indicator';
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
      const existing = document.querySelectorAll('.work-group-highlight, .work-group-indicator');
      existing.forEach((el) => el.remove());
    }

    // Check if page belongs to a work group
    async checkWorkspacesMembership() {
      try {
        const response = await browser.runtime.sendMessage({
          action: 'checkPageInGroups',
          url: window.location.href,
        });

        if (response.success && response.groups.length > 0) {
          // Page belongs to work groups, show indicator
          this.showGroupIndicator(response.groups);
        }
      } catch (error) {
        console.log('Could not check work group membership:', error);
      }
    }

    // Show indicator for work group membership
    showGroupIndicator(groups) {
      if (groups.length === 0) return;

      const primaryGroup = groups[0]; // Use first group's color
      this.highlightPage(primaryGroup.color);

      // Update indicator text with group info
      setTimeout(() => {
        const indicator = document.querySelector('.work-group-indicator');
        if (indicator) {
          indicator.textContent =
            groups.length === 1 ? primaryGroup.name : `${groups.length} Workspacess`;
        }
      }, 100);
    }

    // Utility to create notification
    showNotification(message, type = 'info') {
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

  // Check work group membership on page load
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
