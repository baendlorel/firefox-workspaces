// # Extension APIs
export const $send = <M extends MessageRequest, R = MessageResponseMap[M['action']]>(
  message: M
): Promise<R> => browser.runtime.sendMessage(message) as Promise<R>;
