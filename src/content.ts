// Content script for Workspaces extension
// This script runs on all web pages to provide additional functionality
(function () {
  'use strict';

  // Prevent multiple injections
  if (Reflect.get(window, Consts.InjectionFlag)) {
    return;
  }

  Reflect.set(window, Consts.InjectionFlag, true);
})();
