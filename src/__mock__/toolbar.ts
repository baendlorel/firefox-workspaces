import './toolbar.css';
import { WORKSPACE_COLORS } from '@/lib/consts.js';
import { h } from '@/lib/dom.js';
import locale from '../../_locales/en/messages.json' with { type: 'json' };
import { createWorkspace, createWorkspaceTab } from '@/lib/workspace.js';
import { $sha256 } from '@/lib/utils.js';

// # Mock browser API in dev mode

export class MockBrowser {
  private shouldSucceed: boolean = true;
  private storageKey = 'mock_workspaces_data';

  constructor() {
    if (typeof browser === 'undefined') {
      globalThis.browser = this.createProxy() as typeof browser;
      this.createToolbar();
      console.log('MockBrowser init');
    } else {
      console.log('No need for MockBrowser');
    }
  }

  private getPersist(): Persist & Partial<State> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        // return defaults
        return {
          timestamp: Date.now(),
          workspaces: [],
          settings: { theme: Theme.Auto, sync: Switch.Off },
          _workspaceWindows: {},
          _windowTabs: {},
        } as Persist & Partial<State>;
      }

      const parsed = JSON.parse(stored) as any;
      return {
        timestamp: parsed.timestamp ?? Date.now(),
        workspaces: parsed.workspaces ?? [],
        settings: parsed.settings ?? { theme: Theme.Auto, sync: Switch.Off },
        _workspaceWindows: parsed._workspaceWindows ?? {},
        _windowTabs: parsed._windowTabs ?? {},
      } as Persist & Partial<State>;
    } catch (error) {
      console.error('Failed to parse persist from storage:', error);
      return {
        timestamp: Date.now(),
        workspaces: [],
        settings: { theme: Theme.Auto, sync: Switch.Off },
        _workspaceWindows: {},
        _windowTabs: {},
      } as Persist & Partial<State>;
    }
  }

  private savePersist(p: Partial<Persist> & Partial<State>) {
    try {
      const cur = this.getPersist();
      const merged: any = {
        timestamp: Date.now(),
        workspaces: cur.workspaces.slice(),
        settings: cur.settings,
        _workspaceWindows: cur._workspaceWindows ?? {},
        _windowTabs: cur._windowTabs ?? {},
      };

      if (p.workspaces) merged.workspaces = p.workspaces;
      if (p.settings) merged.settings = p.settings;
      if ((p as any)._workspaceWindows) merged._workspaceWindows = (p as any)._workspaceWindows;
      if ((p as any)._windowTabs) merged._windowTabs = (p as any)._windowTabs;

      localStorage.setItem(this.storageKey, JSON.stringify(merged));
    } catch (error) {
      console.error('Failed to save persist to storage:', error);
    }
  }

  private generateRandomWorkspace(): Workspace {
    const names = [
      'Work',
      'Personal',
      'Study',
      'Research',
      'Project',
      'Shopping',
      'Social',
      'Entertainment',
    ];
    const name = names[Math.floor(Math.random() * names.length)];
    const color = WORKSPACE_COLORS[Math.floor(Math.random() * WORKSPACE_COLORS.length)];

    return createWorkspace({
      id: null,
      name,
      color,
      tabs: [],
      password: '', // No password by default
      passpeek: '', // No hint by default
    });
  }

  private createSampleTab(): WorkspaceTab {
    const sampleTabs = [
      { title: 'GitHub', url: 'https://github.com', favIconUrl: 'https://github.com/favicon.ico' },
      {
        title: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        favIconUrl: 'https://stackoverflow.com/favicon.ico',
      },
      {
        title: 'MDN Web Docs',
        url: 'https://developer.mozilla.org',
        favIconUrl: 'https://developer.mozilla.org/favicon.ico',
      },
      { title: 'npm', url: 'https://npmjs.com', favIconUrl: 'https://npmjs.com/favicon.ico' },
    ];

    const sample = sampleTabs[Math.floor(Math.random() * sampleTabs.length)];
    return createWorkspaceTab({
      id: Math.floor(Math.random() * 100000),
      title: sample.title,
      url: sample.url,
      favIconUrl: sample.favIconUrl,
      pinned: false,
    } as any);
  }

  private createToolbar(): void {
    let isCollapsed = false;

    // Create checkbox input
    const checkbox = h('input', { id: 'success-switch', type: 'checkbox', checked: 'true' });
    checkbox.checked = this.shouldSucceed;
    checkbox.addEventListener('change', () => (this.shouldSucceed = checkbox.checked));

    // Create buttons
    const clearBtn = h('button', 'mock-browser-btn mock-browser-btn--clear', 'Clear Cache');
    clearBtn.title = 'Clear all mock workspace data from localStorage';
    clearBtn.addEventListener('click', () => this.clearCache());

    const createBtn = h('button', 'mock-browser-btn mock-browser-btn--create', 'Random 3 WS');
    createBtn.title = 'Create 3 random workspaces with random tabs';
    createBtn.addEventListener('click', () => void this.createRandomWorkspaces());

    const setCurrentBtn = h(
      'button',
      'mock-browser-btn mock-browser-btn--set-current',
      'Set Current'
    );
    setCurrentBtn.title = 'Create a fake workspace and trigger set-current event';
    setCurrentBtn.addEventListener('click', () => this.triggerSetCurrent());

    // Create toggle button (replaces close button)
    const toggleBtn = h('button', 'mock-browser-btn mock-browser-btn--toggle', '−');
    toggleBtn.title = 'Toggle toolbar collapse/expand';

    // Create controls container for elements that can be hidden
    const controls = h('div', 'mock-browser-controls', [
      h('span', { class: 'mock-browser-checkbox-label' }, [
        checkbox,
        h('label', { for: 'success-switch' }, 'Success'),
      ]),
      clearBtn,
      createBtn,
      setCurrentBtn,
    ]);

    // Create toolbar
    const toolbar = h('div', 'mock-browser-toolbar', [controls, toggleBtn]);

    // Toggle functionality
    toggleBtn.addEventListener('click', () => {
      isCollapsed = !isCollapsed;
      if (isCollapsed) {
        toolbar.classList.add('mock-browser-toolbar--collapsed');
        toggleBtn.textContent = '+';
      } else {
        toolbar.classList.remove('mock-browser-toolbar--collapsed');
        toggleBtn.textContent = '−';
      }
    });

    document.body.appendChild(toolbar);
  }

  private clearCache(): void {
    localStorage.removeItem(this.storageKey);
    console.log('Mock workspace cache cleared');
  }

  private async createRandomWorkspaces(): Promise<void> {
    const persist = this.getPersist();
    const workspaces = persist.workspaces.slice();

    for (let i = 0; i < 3; i++) {
      const workspace = this.generateRandomWorkspace();
      // Add some random tabs
      const numTabs = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numTabs; j++) {
        const tab = this.createSampleTab();
        if (Math.random() > 0.7) {
          tab.pinned = true; // Set pinned to true instead of pushing to pinnedTabs
        }
        workspace.tabs.push(tab); // Always push to tabs array
      }
      // For the third generated workspace, add a mock password
      if (i === 2) {
        // use fixed plaintext password for mock: '123456'
        const plain = '123456';
        const passpeek = plain.substring(0, 3);
        try {
          const hash = await $sha256(plain);
          // assign password fields (use NaN for no lockout)
          (workspace as any).password = hash;
          (workspace as any).passpeek = passpeek;
          (workspace as any).failedAttempts = NaN;
          (workspace as any).lockUntil = NaN;
        } catch (e) {
          console.warn('Failed to generate password hash for mock workspace', e);
        }
      }

      workspaces.push(workspace);
    }

    this.savePersist({ workspaces });
    console.log('Created 3 random workspaces');
  }

  private triggerSetCurrent(): void {
    const tabs = [
      createWorkspaceTab({
        id: 1,
        title: 'Fake Tab 1',
        url: 'https://example.com',
        favIconUrl: 'https://example.com/favicon.ico',
        pinned: true,
        addedAt: Date.now(),
      } as any),
      createWorkspaceTab({
        id: 2,
        title: 'Fake Tab 2',
        url: 'https://github.com',
        favIconUrl: 'https://github.com/favicon.ico',
        pinned: false,
        addedAt: Date.now(),
      } as any),
    ];
    // Create a fake workspace
    const name = `Fake Workspace ${new Date().toLocaleTimeString()}`;
    const color = WORKSPACE_COLORS[Math.floor(Math.random() * WORKSPACE_COLORS.length)];
    const fakeWorkspace = createWorkspace({
      id: null,
      name,
      color,
      tabs: [],
      password: '', // No password for fake workspace
      passpeek: '', // No hint for fake workspace
    });
    fakeWorkspace.tabs = tabs;
  }

  private createResponse(request: MessageRequest): MessageResponseMap[Action] {
    if (!this.shouldSucceed) {
      return {
        success: false,
        error: 'Mock error: Success is disabled',
      } as any;
    }

    const action = request.action;
    const persist = this.getPersist();
    const workspaces = persist.workspaces;

    switch (action) {
      case Action.Open: {
        const req = request as OpenRequest;
        const workspace = workspaces.find((ws) => ws.id === req.workspace.id);

        if (!workspace) {
          return {
            success: false,
            error: 'Workspace not found',
          } as any;
        }

        // Update last opened time
        workspace.lastOpened = Date.now();
        this.savePersist({ workspaces });

        return { succ: true };
      }

      default:
        return {
          succ: false,
          error: `Unknown action: ${action}`,
        } as ErrorResponse;
    }
  }

  private createProxy(path: any[] = []): any {
    const createProxy: typeof this.createProxy = (...args) => this.createProxy(...args);
    const createResponse: typeof this.createResponse = (...args) => this.createResponse(...args);

    const mocki = (s: I18NKey) => {
      return locale[s].message;
    };

    const getPersist = () => this.getPersist();
    const savePersist = (p: Partial<Persist> & Partial<State>) => this.savePersist(p);

    return new Proxy(function () {}, {
      get(_, key) {
        const newPath = [...path, key];
        // console.log('get:', newPath.join('.'));
        return createProxy(newPath);
      },
      set(_, key, value) {
        const newPath = [...path, key];
        // console.log('set:', newPath.join('.'), '=', value);
        return true;
      },
      apply(_0, _1, args) {
        const key = path.join('.');
        console.log('apply:', key, ...args);
        if (key === 'runtime.sendMessage') {
          return Promise.resolve(createResponse(args[0]));
        }
        if (key === 'windows.getCurrent') {
          return Promise.resolve([]);
        }
        if (key === 'i18n.getMessage') {
          return mocki(args[0]);
        }
        if (key === 'storage.local.get' || key === 'storage.sync.get') {
          const arg = args[0];
          const persist = getPersist();
          if (arg === undefined) {
            return Promise.resolve(persist);
          }
          // If an array of keys requested
          if (Array.isArray(arg)) {
            const res: any = {};
            for (const k of arg) {
              if (k === 'timestamp') res.timestamp = persist.timestamp;
              else if (k === 'workspaces') res.workspaces = persist.workspaces;
              else if (k === 'settings') res.settings = persist.settings;
              else if (k === '_workspaceWindows') res._workspaceWindows = persist._workspaceWindows;
              else if (k === '_windowTabs') res._windowTabs = persist._windowTabs;
            }
            return Promise.resolve(res);
          }
          // If a string key
          if (typeof arg === 'string') {
            const k = arg;
            if (k === 'timestamp') return Promise.resolve({ timestamp: persist.timestamp });
            if (k === 'workspaces') return Promise.resolve({ workspaces: persist.workspaces });
            if (k === 'settings') return Promise.resolve({ settings: persist.settings });
            if (k === '_workspaceWindows')
              return Promise.resolve({ _workspaceWindows: persist._workspaceWindows });
            if (k === '_windowTabs') return Promise.resolve({ _windowTabs: persist._windowTabs });
            return Promise.resolve({});
          }
          // If object defaults passed, merge with persist
          if (typeof arg === 'object') {
            const res = { ...arg };
            for (const k of Object.keys(res)) {
              if (k in persist) (res as any)[k] = (persist as any)[k];
            }
            return Promise.resolve(res);
          }
        }
        if (key === 'storage.local.set' || key === 'storage.sync.set') {
          const arg = args[0] || {};
          // Save partial persist
          try {
            savePersist(arg as Partial<Persist> & Partial<State>);
            return Promise.resolve();
          } catch (e) {
            return Promise.reject(e);
          }
        }

        return createProxy(path); // 调用后还能继续链式访问
      },
    });
  }
}
