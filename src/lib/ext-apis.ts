if (globalThis.browser === undefined) {
  const createProxy = function (path: any[] = []): any {
    return new Proxy(function () {}, {
      get(_, key) {
        const newPath = [...path, key];
        console.log('get:', newPath.join('.'));
        return createProxy(newPath);
      },
      set(_, key, value) {
        const newPath = [...path, key];
        console.log('set:', newPath.join('.'), '=', value);
        return true;
      },
      apply(_0, _1, args) {
        console.log('apply:', path.join('.'), 'args:', args);
        return createProxy(path); // 调用后还能继续链式访问
      },
    });
  };
  globalThis.browser = createProxy() as typeof browser;
  console.log('Browser API Mocked');
} else {
  console.log('Browser API exists, not mocking.');
}

// # Extension APIs
export const $send = <M extends Message, R = MessageResponseMap[M['action']]>(
  message: M
): Promise<R> => browser.runtime.sendMessage(message) as Promise<R>;
