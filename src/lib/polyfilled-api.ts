import '@/lib/polyfill.js';

// # Browser APIs - organized by namespace

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

// # i18n
true satisfies IsSameType<I18NEnKey, I18NZhKey>;
export const i: (messageName: I18NKey, substitutions?: any) => string = (
  key: I18NKey,
  ...substitutions: any[]
) => {
  let msg = browser.i18n.getMessage(key);
  for (let i = 0; i < substitutions.length; i++) {
    msg = msg.replaceAll(`$${i}`, substitutions[i]);
  }
  return msg;
};
