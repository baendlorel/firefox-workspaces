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
export function $lget(): Promise<Local>;
export function $lget<T extends LocalKey>(key: T): Promise<{ [K in T]: Local[T] }>;
export function $lget<T extends LocalKey[]>(...keys: T): Promise<PartialLocal<T>>;
export function $lget(...args: LocalKey[]): Promise<any> {
  if (args.length === 0) {
    return browser.storage.local.get();
  }
  return browser.storage.local.get([...args, 'timestamp']); // always get timestamp
}

export const $lpset = async (data: Partial<Persist>) => {
  data.timestamp = Date.now();
  await browser.storage.local.set(data);
};

export const $lset = async (data: Partial<Local>) => {
  data.timestamp = Date.now();
  await browser.storage.local.set(data);
};

export const $lsset = (state: Partial<Local>) => browser.storage.local.set(state);

export const $sget = (): Promise<Persist> => browser.storage.sync.get() as any;
export const $sset = async (persist: Persist) => {
  persist.timestamp = Date.now();
  await browser.storage.sync.set(persist);
};

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
  const { workspaces, _workspaceWindows } = await $lget('workspaces', '_workspaceWindows');
  const entry = Object.entries(_workspaceWindows).find(([, wid]) => wid === windowId);
  if (entry === undefined) {
    return undefined;
  }
  return workspaces.find((w) => w.id === entry[0]);
}

// # i18n
true satisfies IsSameType<I18NEnKey, I18NZhKey>;
export const i = browser.i18n.getMessage as (messageName: I18NKey, substitutions?: any) => string;
