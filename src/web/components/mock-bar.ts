import { Action } from '@/lib/consts.js';

// # Mock browser API in dev mode

class MockBrowser {
  constructor() {
    globalThis.browser = this.createProxy() as typeof browser;
    console.log('MockBrowser init');
  }

  private createResponse(request: any) {
    const action = request.action;

    if (action === Action.GetWorkspaces) {
      return {
        success: true,
        data: [],
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

  private createProxy(path: any[] = []): any {
    const thisArg = this;

    return new Proxy(function () {}, {
      get(_, key) {
        const newPath = [...path, key];
        console.log('get:', newPath.join('.'));
        return thisArg.createProxy(newPath);
      },
      set(_, key, value) {
        const newPath = [...path, key];
        console.log('set:', newPath.join('.'), '=', value);
        return true;
      },
      apply(_0, _1, args) {
        const key = path.join('.');
        console.log('apply:', key, ...args);
        if (key === 'runtime.sendMessage') {
          return thisArg.createResponse(args[0]);
        }

        return thisArg.createProxy(path); // 调用后还能继续链式访问
      },
    });
  }
}
export default new MockBrowser();
