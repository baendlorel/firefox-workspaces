// # Extension APIs
export const $send: <T>(message: T) => Promise<any> = browser.runtime.sendMessage;
