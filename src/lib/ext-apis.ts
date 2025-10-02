import { MockBrowser } from '@/__mock__/toolbar.js';
import { Sym } from './consts.js';

if (__IS_DEV__) {
  new MockBrowser();
}

// # Extension APIs
export const $send = <M extends MessageRequest, R = MessageResponseMap[M['action']]>(
  message: M
): Promise<R> => browser.runtime.sendMessage(message) as Promise<R>;

export const $aboutBlank = () =>
  browser.windows.create({
    url: 'about:blank',
    type: 'normal',
  });

export function $lsget(): Promise<WorkspaceState>;
export function $lsget<T extends WorkspaceStateKey>(key: T): Promise<WorkspaceState[T]>;
export function $lsget(defaultState: WorkspaceState): Promise<WorkspaceState>;
export function $lsget(arg = Sym.NotProvided): Promise<any> {
  if (arg === Sym.NotProvided) {
    return browser.storage.local.get();
  }
  return browser.storage.local.get(arg);
}

export const $lsset = (state: Partial<WorkspaceState>): Promise<void> =>
  browser.storage.local.set(state);

true satisfies IsSameType<I18NEnKey, I18NZhKey>;
export const i = browser.i18n.getMessage as (messageName: I18NKey, substitutions?: any) => string;
