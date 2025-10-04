import { i, $windowWorkspace, $notify } from './lib/ext-apis.js';
import { store } from './lib/storage.js';
import { Action, Switch, Theme, NotProvided } from './lib/consts.js';
import { $sleep, $thm } from './lib/utils.js';
import { isValidWorkspaces } from './lib/workspace.js';
import { isValidSettings } from './lib/settings.js';

import { WorkspaceManager } from './manager.js';

type ChangeInfo = browser.tabs._OnUpdatedChangeInfo &
  browser.tabs._OnAttachedAttachInfo &
  browser.tabs._OnMovedMoveInfo &
  browser.tabs._OnRemovedRemoveInfo &
  browser.tabs._OnDetachedDetachInfo;

class WorkspaceBackground {
  private readonly manager: WorkspaceManager;
  private syncer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const updatedAt = new Date('__DATE_TIME__');
    const delta = Date.now() - updatedAt.getTime();
    const min = Math.floor(delta / 60000);
    const time = min < 1 ? i('justNow') : i('minutesAgo', min);
    logger.info('Updated before ' + time);

    this.manager = new WorkspaceManager();
    this.init();
  }

  private async init() {
    // # init storage
    const sync = await store.syncGet();

    const {
      workspaces: sworkspaces = NotProvided,
      settings: ssettings = NotProvided,
      timestamp: stimestamp = NotProvided,
    } = sync;

    const local = await store.localGet();
    const { workspaces = NotProvided, settings = NotProvided, timestamp = NotProvided } = local;

    // Brand new
    if (timestamp === NotProvided && stimestamp === NotProvided) {
      logger.info('No existing data found, initializing with default values');
      await this.initLocalWith({});
    } else if (timestamp === NotProvided && Number.isSafeInteger(stimestamp)) {
      logger.info('sync data found');
      await this.initLocalWith({ workspaces: sworkspaces, settings: ssettings });
    } else if (Number.isSafeInteger(timestamp) && stimestamp === NotProvided) {
      logger.info('local data found');
      await this.initLocalWith({ workspaces, settings });
    } else if (Number.isSafeInteger(timestamp) && Number.isSafeInteger(stimestamp)) {
      logger.info('local/sync found', timestamp > stimestamp ? 'local' : 'sync', 'is newer');
      if (timestamp > stimestamp) {
        await this.initLocalWith({ workspaces, settings });
      } else {
        await this.initLocalWith({ workspaces: sworkspaces, settings: ssettings });
      }
    } else {
      logger.warn('Invalid timestamps, re-initializing with default values');
      await this.initLocalWith({});
    }

    await this.registerListeners();

    // # start sync if enabled
    const { settings: realSettings } = await store.localGet('settings');
    if (isValidSettings(realSettings) ? realSettings.sync === Switch.On : true) {
      await this.initSync();
    }
  }

  private async initLocalWith(data: { workspaces?: unknown; settings?: unknown } = {}) {
    let { workspaces = NotProvided, settings = NotProvided } = data as any;

    if (!isValidWorkspaces(workspaces)) {
      if (workspaces !== NotProvided) {
        logger.error('data.workspaces must be Workspace[]', workspaces);
      }
      workspaces = [] satisfies Workspace[];
    }

    if (!isValidSettings(settings)) {
      if (settings !== NotProvided) {
        logger.error('data.settings must be Settings object', settings);
      }
      settings = { theme: Theme.Auto, sync: Switch.On } satisfies Settings;
    }

    const _workspaceWindows: Record<string, number> = {};
    const _windowTabs: Record<string, browser.tabs.Tab[]> = {};

    await store.localPersistSet({ workspaces, settings });
    await store.localStateSet({ _workspaceWindows, _windowTabs });
  }

  private registerListeners() {
    this.runtimeListeners();
    this.tabListeners();
    this.windowListeners();
  }

  private runtimeListeners() {
    browser.runtime.onStartup.addListener(() => this.init());
    browser.runtime.onInstalled.addListener(() => this.init());
    browser.runtime.onMessage.addListener(async (message) =>
      this.handlePopupMessage(message).catch((e) => {
        logger.error('onMessage Error', e);
        return { succ: false, error: 'Error handling message.' };
      })
    );
  }

  private windowListeners() {
    browser.windows.onRemoved.addListener(async (windowId) => {
      // Check if this window belongs to a workspace
      const workspace = await $windowWorkspace(windowId);
      if (!workspace) {
        return;
      }

      workspace.tabs = await this.manager.getWindowTabs(windowId);
      await this.manager.deactivate(workspace.id);
      await this.manager.save(workspace);
    });
  }

  private tabListeners() {
    browser.tabs.onCreated.addListener((tab) => this.manager.addTabToWindow(tab));

    // # cases of refresh
    browser.tabs.onAttached.addListener((_tabId, info) => this.refreshTab(info));
    browser.tabs.onDetached.addListener((_tabId, info) => this.refreshTab(info));
    browser.tabs.onMoved.addListener((_tabId, info) => this.refreshTab(info));
    browser.tabs.onRemoved.addListener((_tabId, info) => this.refreshTab(info));
    browser.tabs.onUpdated.addListener(async (_tabId, info, tab) => {
      if ((info.status === 'complete' || info.status === 'loading') && tab) {
        await this.refreshTab({ windowId: tab.windowId });
      }
    });
  }

  private async refreshTab(info: Partial<ChangeInfo>) {
    const windowId = info.windowId ?? info.newWindowId ?? info.oldWindowId ?? NotProvided;
    if (windowId === NotProvided) {
      return;
    }

    // isWindowClosing would be false or undefined
    if (!info.isWindowClosing) {
      await this.manager.refreshWindowTab(windowId);
    }
  }

  private async handlePopupMessage(message: MessageRequest): Promise<MessageResponse> {
    switch (message.action) {
      case Action.Open: {
        const data = await this.manager.open(message.workspace);
        return { succ: data.id !== browser.windows.WINDOW_ID_NONE };
      }

      case Action.ToggleSync:
        if (message.sync === Switch.On) {
          await this.initSync();
        } else {
          await this.stopSync();
        }
        return { succ: true };

      case Action.Export:
        await this.manager.saveAllTab();
        return { succ: true };

      case Action.Import:
        // Inject content script to active tab and trigger file import
        await this.injectContentScriptAndImport();
        return { succ: true };

      case Action.OpenFileInput:
        return { succ: false, from: 'background' };

      case Action.ReturnFileData: {
        // Handle the actual import data from content script
        let obj: any = null;
        try {
          obj = JSON.parse(message.data);
        } catch (error) {
          // Show notification
          const notificationId = await browser.notifications.create({
            type: 'basic',
            iconUrl: browser.runtime.getURL('public/icon-128.png'),
            title: 'Import Failed',
            message: error instanceof Error ? error.message : String(error),
          });
          setTimeout(() => browser.notifications.clear(notificationId), 5000);
          return {
            succ: false,
            message: '',
            addedCount: 0,
          };
        }

        const result = await this.manager.importData(obj);
        $notify(result.message, 'Import');
        return result;
      }

      default:
        message satisfies never;
        break;
    }

    // Error
    return {
      succ: false,
      error: 'Unknown message: ' + String(message),
    };
  }

  private async injectContentScriptAndImport() {
    try {
      // Get active tab
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];

      if (!tab || !tab.id) {
        logger.error('No active tab found');
        return;
      }

      // Inject content script
      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['dist/content.js'],
      });

      // Wait a bit for content script to initialize
      await $sleep(200);

      // Trigger file import in content script
      const request: OpenFileInputRequest = { action: Action.OpenFileInput };
      const reply = await browser.tabs.sendMessage(tab.id, request);
      logger.succ('Message reply from content script:', reply);
      $notify('Message reply from content script', 'Import');
    } catch (error) {
      logger.error('Failed to inject content script:', error);
      $notify('Failed to inject content script', 'Import');
    }
  }

  async initSync() {
    const EVERY_X_MINUTES = 5;

    // Avoid scheduling multiple concurrent timers
    if (this.syncer !== null) {
      return;
    }
    logger.info('start sync');

    const task = async () => {
      logger.verbose('Sync storage on', $thm());

      // * Might change if more features are added
      const local = await store.localGet('workspaces', 'settings').catch((e) => {
        logger.error('Error while syncing, loading local', e);
        return null;
      });

      if (local === null) {
        scheduleNext();
        return;
      }

      await store.syncSet(local).catch((e) => logger.error('Error while syncing, saving sync', e));
      scheduleNext();
    };

    const scheduleNext = () => {
      const minute = new Date().getMinutes();
      const delta = EVERY_X_MINUTES - (minute % EVERY_X_MINUTES);
      // store timer id so it can be cancelled
      this.syncer = setTimeout(task, delta * 60000);
    };

    // first schedule
    scheduleNext();
  }

  async stopSync() {
    if (this.syncer !== null) {
      logger.info('stop sync');
      clearTimeout(this.syncer);
      this.syncer = null;
    }
  }
}

new WorkspaceBackground();
