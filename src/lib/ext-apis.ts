import { Action } from './consts.js';

// # Mock browser API in dev mode
// todo 还需要模拟更多api，并加入按钮控制
if (__IS_DEV__) {
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
        const key = path.join('.');
        console.log('apply:', key, ...args);
        const action = args[0].action;
        if (key === 'runtime.sendMessage') {
          if (action === Action.GetWorkspaces) {
            return {
              success: true,
              data: [
                {
                  id: 'test-id-0',
                  name: 'ws name',
                  color: '#f8f9fa',
                  tabs: [],
                  pinnedTabs: [],
                },
              ],
            };
          }
          if (action === Action.CreateWorkspaces) {
            return {
              success: true,
              data: {
                id: 'test-id',
                name: 'ws name',
                color: '#f8f9fa',
                tabs: [],
                pinnedTabs: [],
              },
            };
          }
        }

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
