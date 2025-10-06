import '@/lib/polyfill.js';
import { MockBrowser } from '@/__mock__/toolbar.js';
import { store } from './storage.js';

if (__IS_DEV__) {
  new MockBrowser();
}

// # Browser APIs - organized by namespace
export const $setBadge = (options: {
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

// # Helper functions
export const $aboutBlank = () =>
  browser.windows.create({ url: 'about:blank', type: 'normal' }) as Promise<WindowWithId>;

type Send = <M extends MessageRequest, R = MessageResponseMap[M['action']]>(
  message: M
) => Promise<R>;
export const $send = browser.runtime.sendMessage as Send;

export const $notify = (message: string, time: number = 12000) =>
  browser.notifications
    .create({
      type: 'basic',
      iconUrl: browser.runtime.getURL('dist/assets/icon-128.png'),
      title: i('extension.name'),
      message,
    })
    .then((id) => setTimeout(() => browser.notifications.clear(id), time));

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
