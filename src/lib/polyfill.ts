/**
 * Chrome compatibility polyfill layer
 * This file provides a browser object that works in both Firefox and Chrome
 */

/// <reference types="chrome" />

(() => {
  if (Reflect.has(globalThis, Consts.PolyfillFlag)) {
    return;
  }

  const isObject = (o: unknown) => typeof o === 'object' && o !== null;

  // Check if we're running in Chrome or Firefox
  const isChrome = isObject(globalThis.chrome?.runtime);
  const isFirefox = isObject(globalThis.browser?.runtime);

  // Convert Chrome callback-based API to Promise-based API
  function promisify<T>(fn: Function, context?: any): (...args: any[]) => Promise<T> {
    return function (...args: any[]): Promise<T> {
      return new Promise((resolve, reject) => {
        fn.call(context, ...args, (result: T) => {
          const chromeRuntime = (globalThis as any).chrome?.runtime;
          if (chromeRuntime?.lastError) {
            reject(new Error(chromeRuntime.lastError.message));
          } else {
            resolve(result);
          }
        });
      });
    };
  }

  if (!isFirefox && isChrome) {
    // Chrome: create browser object from chrome
    const chromeApi = globalThis.chrome;

    const browserPolyfill = {
      // tabs API
      tabs: {
        TAB_ID_NONE: chromeApi.tabs.TAB_ID_NONE ?? -1,

        query: promisify<chrome.tabs.Tab[]>(chromeApi.tabs.query, chromeApi.tabs),
        create: promisify<chrome.tabs.Tab>(chromeApi.tabs.create, chromeApi.tabs),
        update: (tabId: number, updateProperties: chrome.tabs.UpdateProperties) =>
          promisify<chrome.tabs.Tab>(chromeApi.tabs.update, chromeApi.tabs)(
            tabId,
            updateProperties
          ),
        remove: (tabIds: number | number[]) =>
          promisify<void>(chromeApi.tabs.remove, chromeApi.tabs)(tabIds),
        getCurrent: promisify<chrome.tabs.Tab>(chromeApi.tabs.getCurrent, chromeApi.tabs),

        onCreated: chromeApi.tabs.onCreated,
        onAttached: chromeApi.tabs.onAttached,
        onDetached: chromeApi.tabs.onDetached,
        onMoved: chromeApi.tabs.onMoved,
        onRemoved: chromeApi.tabs.onRemoved,
        onUpdated: chromeApi.tabs.onUpdated,

        // Type definitions for Firefox-specific interfaces
        _OnUpdatedChangeInfo: {} as any,
        _OnAttachedAttachInfo: {} as any,
        _OnMovedMoveInfo: {} as any,
        _OnRemovedRemoveInfo: {} as any,
        _OnDetachedDetachInfo: {} as any,
      },

      // windows API
      windows: {
        WINDOW_ID_NONE: chromeApi.windows.WINDOW_ID_NONE ?? -1,

        create: promisify<chrome.windows.Window>(chromeApi.windows.create, chromeApi.windows),
        update: (windowId: number, updateInfo: chrome.windows.UpdateInfo) =>
          promisify<chrome.windows.Window>(chromeApi.windows.update, chromeApi.windows)(
            windowId,
            updateInfo
          ),
        getCurrent: promisify<chrome.windows.Window>(
          chromeApi.windows.getCurrent,
          chromeApi.windows
        ),

        onRemoved: chromeApi.windows.onRemoved,
      },

      // runtime API
      runtime: {
        sendMessage: <T = any>(message: any): Promise<T> =>
          promisify<T>(chromeApi.runtime.sendMessage, chromeApi.runtime)(message),
        getURL: (path: string) => chromeApi.runtime.getURL(path),

        onStartup: chromeApi.runtime.onStartup,
        onInstalled: chromeApi.runtime.onInstalled,
        onMessage: chromeApi.runtime.onMessage,

        lastError: chromeApi.runtime.lastError,
      },

      // action API (Chrome uses action, Firefox uses browserAction for MV2)
      action: {
        setBadgeTextColor: promisify<void>(
          chromeApi.action?.setBadgeTextColor,
          chromeApi.action ?? chromeApi.browserAction
        ),
        setBadgeBackgroundColor: promisify<void>(
          chromeApi.action?.setBadgeBackgroundColor ??
            chromeApi.browserAction?.setBadgeBackgroundColor,
          chromeApi.action ?? chromeApi.browserAction
        ),
        setBadgeText: promisify<void>(
          chromeApi.action?.setBadgeText ?? chromeApi.browserAction?.setBadgeText,
          chromeApi.action ?? chromeApi.browserAction
        ),
      },

      // storage API
      storage: {
        local: {
          get: (keys?: string | string[] | null): Promise<any> =>
            promisify<any>(chromeApi.storage.local.get, chromeApi.storage.local)(keys),
          set: (items: any): Promise<void> =>
            promisify<void>(chromeApi.storage.local.set, chromeApi.storage.local)(items),
        },
        sync: {
          get: (keys?: string | string[] | null): Promise<any> =>
            promisify<any>(chromeApi.storage.sync.get, chromeApi.storage.sync)(keys),
          set: (items: any): Promise<void> =>
            promisify<void>(chromeApi.storage.sync.set, chromeApi.storage.sync)(items),
        },
        onChanged: chromeApi.storage.onChanged,
      },

      // notifications API
      notifications: {
        create: (options: chrome.notifications.NotificationOptions): Promise<string> =>
          promisify<string>(chromeApi.notifications.create, chromeApi.notifications)(options),
        clear: (notificationId: string): Promise<boolean> =>
          promisify<boolean>(
            chromeApi.notifications.clear,
            chromeApi.notifications
          )(notificationId),
      },

      // i18n API
      i18n: {
        getMessage: (messageName: string, substitutions?: any): string =>
          chromeApi.i18n.getMessage(messageName, substitutions),
      },

      // extension API
      extension: {
        getViews: (fetchProperties?: chrome.extension.FetchProperties): Window[] =>
          chromeApi.extension.getViews(fetchProperties),
      },
    };

    // Expose browser object globally
    if (typeof window !== 'undefined') {
      (window as any).browser = browserPolyfill;
    }
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).browser = browserPolyfill;
    }
  }

  Reflect.set(globalThis, Consts.PolyfillFlag, true);
})();
// Export for type safety
export {};
