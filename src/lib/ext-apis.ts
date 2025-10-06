import { MockBrowser } from '@/__mock__/toolbar.js';
import { store } from './storage.js';

if (__IS_DEV__) {
  new MockBrowser();
}

// # Extension APIs
export const $send = <M extends MessageRequest, R = MessageResponseMap[M['action']]>(
  message: M
): Promise<R> => browser.runtime.sendMessage(message) as Promise<R>;

export const $aboutBlank = (): Promise<WindowWithId> =>
  browser.windows.create({
    url: 'about:blank',
    type: 'normal',
  }) as Promise<WindowWithId>;

export const $notify = (message: string, time: number = 12000) =>
  browser.notifications
    .create({
      type: 'basic',
      iconUrl: browser.runtime.getURL('dist/assets/icon-128.png'),
      title: i('extensionName'),
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
