import { getByValue } from 'flat-pair';
import { MockBrowser } from '@/__mock__/toolbar.js';

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

// # storage
export function $lsget(): Promise<Local>;
export function $lsget<T extends LocalKey>(key: T): Promise<{ [K in T]: Local[T] }>;
export function $lsget<T extends LocalKey[]>(...keys: T): Promise<PartialLocal<T>>;
export function $lsget(...args: any[]): Promise<any> {
  return browser.storage.local.get(args);
}

export const $lsset = (state: Partial<Local>): Promise<void> => browser.storage.local.set(state);

// # common services
export async function $findWorkspaceByWindowId(
  windowId: number | undefined
): Promise<Workspace | undefined> {
  if (windowId === undefined) {
    return undefined;
  }
  const { workspaces, _workspaceWindows } = await $lsget('workspaces', '_workspaceWindows');
  const workspaceId = getByValue<string, number>(_workspaceWindows, windowId);
  return workspaces.find((w) => w.id === workspaceId);
}

// # i18n
true satisfies IsSameType<I18NEnKey, I18NZhKey>;
export const i = browser.i18n.getMessage as (messageName: I18NKey, substitutions?: any) => string;
