import { MockBrowser } from '@/__mock__/toolbar.js';
import { RandomNameLanguage, Sym, Theme } from './consts.js';

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

const DEFAULT = {
  workspaces: [],
  settings: { randomNameLanguage: RandomNameLanguage.Auto, theme: Theme.Auto },
  activatedMap: new Map(), // windowId -> workspaceId
};
export function $lsget(): Promise<WorkspaceState>;
export function $lsget<T extends WorkspaceStateKey>(key: T): Promise<WorkspaceState[T]>;
export function $lsget(defaultState: WorkspaceState): Promise<WorkspaceState>;
export function $lsget(arg = Sym.NotProvided): Promise<any> {
  if (arg === Sym.NotProvided) {
    return browser.storage.local.get(DEFAULT);
  }

  const key = arg as WorkspaceStateKey;
  switch (key) {
    case 'workspaces':
      return browser.storage.local.get({ workspaces: DEFAULT.workspaces });
    case 'settings':
      return browser.storage.local.get({ settings: DEFAULT.settings });
    case 'activatedMap':
      return browser.storage.local.get({ activatedMap: DEFAULT.activatedMap });
    default:
      key satisfies never;
  }
  return browser.storage.local.get(DEFAULT);
}

export const $lsset = (state: Partial<WorkspaceState>): Promise<void> =>
  browser.storage.local.set(state);

true satisfies IsSameType<I18NEnKey, I18NZhKey>;
export const i = browser.i18n.getMessage as (messageName: I18NKey, substitutions?: any) => string;
