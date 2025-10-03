import { MockBrowser } from '@/__mock__/toolbar.js';
import { findByValue } from 'flat-pair';

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

type PartialLocal<T extends LocalKey[]> = {
  [K in T[number]]: Local[K];
};

// # storage
export function $lsget(): Promise<Local>;
export function $lsget<T extends LocalKey>(key: T): Promise<{ [K in T]: Local[T] }>;
export function $lsget<T extends LocalKey[]>(key: T): Promise<PartialLocal<T>>;
export function $lsget(arg?: any): Promise<any> {
  if (arg === undefined) {
    const keys: (keyof Persist)[] = ['workspaces', 'settings'];
    return browser.storage.sync.get(keys);
  }
  return browser.storage.local.get(arg);
}

export const $lsset = (state: Partial<State>): Promise<void> => browser.storage.local.set(state);

export async function $findWorkspaceByWindowId(
  windowId: number | undefined
): Promise<WorkspacePlain | undefined> {
  if (windowId === undefined) {
    return undefined;
  }

  const { persist, state } = await $lsget();
  const workspaceId = findByValue<string, number>(state.workspaceToWindow, windowId);
  return persist.workspaces.find((w) => w.id === workspaceId);
}

// # i18n
true satisfies IsSameType<I18NEnKey, I18NZhKey>;
export const i = browser.i18n.getMessage as (messageName: I18NKey, substitutions?: any) => string;
