import { i, $notify } from './lib/polyfilled-api.js';

import { store } from './lib/storage.js';
import { NotProvided } from './lib/consts.js';
import { isValidWorkspaces } from './lib/workspace.js';
import { isValidSettings } from './lib/settings.js';

import { WorkspaceManager } from './manager.js';

class WorkspaceBackground {
  private readonly manager: WorkspaceManager;

  constructor() {
    const updatedAt = new Date('__DATE_TIME__');
    const delta = Date.now() - updatedAt.getTime();
    const min = Math.floor(delta / 60000);
    const time = min < 1 ? i('time.just-now') : i('time.minutes-ago', min);
    logger.info('Updated before ' + time);

    this.manager = new WorkspaceManager();
    this.init();
  }

  private async init() {
    // # init storage
    const local = await store.localGet();
    const { workspaces = NotProvided, settings = NotProvided, timestamp = NotProvided } = local;

    if (timestamp === NotProvided) {
      logger.info('No existing data found, initializing with default values');
      await this.initLocalWith({});
    } else if (Number.isSafeInteger(timestamp)) {
      logger.info('local data found');
      await this.initLocalWith({ workspaces, settings });
    } else {
      logger.warn('Invalid timestamp, re-initializing with default values');
      await this.initLocalWith({});
    }

    this.runtimeListeners();
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
      settings = { theme: Theme.Auto } satisfies Settings;
    }

    await store.localPersistSet({ workspaces, settings });
  }

  private runtimeListeners() {
    browser.runtime.onStartup.addListener(() => this.init());
    browser.runtime.onInstalled.addListener(() => this.init());
    browser.runtime.onMessage.addListener(async (message) =>
      this.handlePopupMessage(message).catch((e) => {
        logger.error('onMessage Error', e);
        return { succ: false, error: 'Error handling message.' };
      }),
    );
  }

  private async handlePopupMessage(message: MessageRequest): Promise<MessageResponse> {
    switch (message.action) {
      case Action.Open: {
        const data = await this.manager.open(message.workspace);
        return { succ: data.id !== browser.windows.WINDOW_ID_NONE };
      }

      case Action.OpenPage:
        await this.openPage(message.page);
        return { succ: true };

      case Action.ReturnFileData: {
        const data = JSON.parse(message.data as string) as ExportData;
        const result = await this.manager.importData(data);
        $notify(result.message);
        return result;
      }

      case Action.CaptureTabs: {
        const tabs = await this.manager.captureCurrentTabs();
        return { succ: true, tabs };
      }

      case Action.UpdateTabs: {
        await this.manager.updateWorkspaceTabs(message.workspaceId, message.tabs);
        return { succ: true };
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

  private openPage(fileName: PopupPage) {
    const wh: { [k in PopupPage]: { width: number; height: number } } = {
      [PopupPage.Import]: { width: 475, height: 465 },
      [PopupPage.Donate]: { width: 475, height: 705 },
      [PopupPage.About]: { width: 800, height: 740 },
      [PopupPage.Export]: { width: 520, height: 740 },
    };

    return browser.windows.create({
      url: `dist/pages/${fileName}.html`,
      type: 'popup',
      ...wh[fileName],
    });
  }
}

new WorkspaceBackground();
