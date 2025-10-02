// Content script for Workspaces extension
// This script runs on all web pages to provide additional functionality
import '@/lib/promise-ext.js';
import { Sym } from './lib/consts.js';

(function () {
  'use strict';

  // Prevent multiple injections
  if (Reflect.get(window, Sym.InjectionFlag)) {
    return;
  }

  Reflect.set(window, Sym.InjectionFlag, true);

  logger.succ('Injecting content script');

  // Content script for handling page-specific features
  class WorkspacesContent {
    constructor() {}
  }
})();
