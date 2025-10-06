import '@/lib/polyfill.js';
import { MockBrowser } from '@/__mock__/toolbar.js';
import { store } from './storage.js';

if (__IS_DEV__) {
  new MockBrowser();
}

// # Browser Constants
export const TAB_ID_NONE = browser.tabs.TAB_ID_NONE;
export const WINDOW_ID_NONE = browser.windows.WINDOW_ID_NONE;

// # Browser Events
export const $runtimeEvents = {
  onStartup: browser.runtime.onStartup,
  onInstalled: browser.runtime.onInstalled,
  onMessage: browser.runtime.onMessage,
} as const;

export const $tabsEvents = {
  onCreated: browser.tabs.onCreated,
  onAttached: browser.tabs.onAttached,
  onDetached: browser.tabs.onDetached,
  onMoved: browser.tabs.onMoved,
  onRemoved: browser.tabs.onRemoved,
  onUpdated: browser.tabs.onUpdated,
} as const;

export const $windowsEvents = {
  onRemoved: browser.windows.onRemoved,
} as const;

export const $storageEvents = {
  onChanged: browser.storage.onChanged,
} as const;

// # Tabs APIs
export const $tabsQuery = (queryInfo: browser.tabs._QueryQueryInfo) =>
  browser.tabs.query(queryInfo);

export const $tabsCreate = (createProperties: browser.tabs._CreateCreateProperties) =>
  browser.tabs.create(createProperties);

export const $tabsRemove = (tabIds: number | number[]) => browser.tabs.remove(tabIds);

export const $tabsGetCurrent = () => browser.tabs.getCurrent();

// # Windows APIs
export const $windowsGetCurrent = () => browser.windows.getCurrent();

export const $windowsUpdate = (windowId: number, updateInfo: browser.windows._UpdateUpdateInfo) =>
  browser.windows.update(windowId, updateInfo);

export const $windowsCreate = (createData: browser.windows._CreateCreateData) =>
  browser.windows.create(createData);

export const $aboutBlank = (): Promise<WindowWithId> =>
  $windowsCreate({
    url: 'about:blank',
    type: 'normal',
  }) as Promise<WindowWithId>;

// # Runtime APIs
export const $send = <M extends MessageRequest, R = MessageResponseMap[M['action']]>(
  message: M
): Promise<R> => browser.runtime.sendMessage(message) as Promise<R>;

export const $runtimeGetURL = (path: string) => browser.runtime.getURL(path);

// # Action APIs
export const $actionSetBadge = (options: {
  text: string;
  color: string;
  backgroundColor: string;
  windowId: number;
}) => {
  const { text, color, backgroundColor, windowId } = options;
  browser.action.setBadgeTextColor({ color, windowId });
  browser.action.setBadgeBackgroundColor({ color: backgroundColor, windowId });
  browser.action.setBadgeText({ text, windowId });
};

// # Extension APIs
export const $extensionGetViews = (fetchProperties?: browser.extension._GetViewsFetchProperties) =>
  browser.extension.getViews(fetchProperties);

// # Notifications APIs
export const $notify = (message: string, time: number = 12000) =>
  browser.notifications
    .create({
      type: 'basic',
      iconUrl: $runtimeGetURL('dist/assets/icon-128.png'),
      title: i('extension.name'),
      message,
    })
    .then((notificationId) => setTimeout(() => browser.notifications.clear(notificationId), time));

// # common services
/**
 * Get workspace by `windowId`
 */
export async function $windowWorkspace(
  windowId: number | undefined
): Promise<Workspace | undefined> {
  if (windowId === undefined) {
    return undefined;
  }
  const { workspaces, _workspaceWindows } = await store.localGet('workspaces', '_workspaceWindows');
  const entry = Object.entries(_workspaceWindows).find(([, wid]) => wid === windowId);
  if (entry === undefined) {
    return undefined;
  }
  return workspaces.find((w) => w.id === entry[0]);
}

// # i18n
true satisfies IsSameType<I18NEnKey, I18NZhKey>;
export const i: (messageName: I18NKey, substitutions?: any) => string = (
  key: I18NKey,
  substitutions?: any
) => {
  const msg = browser.i18n.getMessage(key);
  if (typeof substitutions === 'object' && substitutions !== null) {
    return Object.entries(substitutions).reduce(
      (str, [k, v]) => str.replace(`{${k}}`, v as string),
      msg
    );
  }
  return msg;
};
