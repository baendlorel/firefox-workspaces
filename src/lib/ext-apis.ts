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

// # storage
export function $lsget(): Promise<Local>;
export function $lsget<T extends LocalKey>(key: T): Promise<{ [K in T]: Local[T] }>;
export function $lsget<T extends LocalKey[]>(key: T): Promise<PartialLocal<T>>;
export function $lsget(...args: any[]): Promise<any> {
  return browser.storage.local.get(...args);
}

export const $lsset = (state: Partial<State>): Promise<void> => browser.storage.local.set(state);

export function $pget(): Promise<Persist>;
export function $pget<T extends PersistKey>(key: T): Promise<{ [K in T]: Persist[T] }>;
export function $pget<T extends PersistKey[]>(key: T): Promise<PartialPersist<T>>;
export function $pget(...args: any[]): Promise<any> {
  return browser.storage.local.get(...args);
}
export const $pset = (state: Partial<State>): Promise<void> => browser.storage.local.set(state);

export function $sget(): Promise<State>;
export function $sget<T extends StateKey>(key: T): Promise<{ [K in T]: State[T] }>;
export function $sget<T extends StateKey[]>(key: T): Promise<PartialState<T>>;
export function $sget(...args: any[]): Promise<any> {
  return browser.storage.local.get(...args);
}
export const $sset = (state: Partial<State>): Promise<void> => browser.storage.local.set(state);

// # common services
export async function $findWorkspaceByWindowId(
  windowId: number | undefined
): Promise<Workspace | undefined> {
  if (windowId === undefined) {
    return undefined;
  }

  const { persist, state } = await $lsget('workspaces');
  const workspaceId = findByValue<string, number>(state.workspaceToWindow, windowId);
  return persist.workspaces.find((w) => w.id === workspaceId);
}

// # i18n
true satisfies IsSameType<I18NEnKey, I18NZhKey>;
export const i = browser.i18n.getMessage as (messageName: I18NKey, substitutions?: any) => string;
