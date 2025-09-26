import { $mockBrowser } from './utils.js';

$mockBrowser();

// # Extension APIs
export const $send = <M extends Message, R = MessageResponseMap[M['action']]>(
  message: M
): Promise<R> => browser.runtime.sendMessage(message) as Promise<R>;
