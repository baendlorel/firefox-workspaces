import './toolbar.css';
import { Action, WORKSPACE_COLORS } from '@/lib/consts.js';
import { h } from '@/lib/dom.js';
import { WorkspaceTab } from '@/lib/workspace-tab.js';
import { Workspace } from '@/lib/workspace.js';

// # Mock browser API in dev mode

class MockBrowser {
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

  private getStoredWorkspaces(): Workspace[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      const parsedData = JSON.parse(stored);
      // Convert plain objects back to Workspace instances
      return parsedData.map((data: any) => {
        const workspace = new Workspace(data);
        workspace.id = data.id;
        workspace.tabs = data.tabs || [];
        workspace.createdAt = data.createdAt;
        workspace.lastOpened = data.lastOpened;
        workspace.windowId = data.windowId;
        return workspace;
      });
    } catch (error) {
      console.error('Failed to load workspaces from storage:', error);
      return [];
    }
  }

  private saveWorkspaces(workspaces: Workspace[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(workspaces));
    } catch (error) {
      console.error('Failed to save workspaces to storage:', error);
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

    return new Workspace({ id: null, name, color, tabs: [] });
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
    return WorkspaceTab.from({
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
    createBtn.addEventListener('click', () => this.createRandomWorkspaces());

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
    alert('Cache cleared!');
  }

  private createRandomWorkspaces(): void {
    const workspaces = this.getStoredWorkspaces();

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
      workspaces.push(workspace);
    }

    this.saveWorkspaces(workspaces);
    console.log('Created 3 random workspaces');
    alert('Created 3 random workspaces!');
  }

  private triggerSetCurrent(): void {
    const tabs = [
      WorkspaceTab.from({
        id: 1,
        title: 'Fake Tab 1',
        url: 'https://example.com',
        favIconUrl: 'https://example.com/favicon.ico',
        pinned: true,
        addedAt: Date.now(),
      } as any),
      WorkspaceTab.from({
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
    const fakeWorkspace = new Workspace({ id: null, name, color, tabs: [] });
    fakeWorkspace.tabs = tabs;
    fakeWorkspace.windowId = 999;
  }

  private createResponse(request: MessageRequest): MessageResponse {
    if (!this.shouldSucceed) {
      return {
        success: false,
        error: 'Mock error: Success is disabled',
      } as any;
    }

    const action = request.action;
    const workspaces = this.getStoredWorkspaces();

    switch (action) {
      case Action.Get:
        return {
          success: true,
          data: workspaces,
        } as GetResponse;

      case Action.Save: {
        const req = request as SaveRequest;
        const newWorkspace = new Workspace(req.data);

        workspaces.push(newWorkspace);
        this.saveWorkspaces(workspaces);

        return {
          success: true,
          data: newWorkspace,
        } as SaveResponse;
      }

      case Action.Delete: {
        const req = request as DeleteRequest;
        const filteredWorkspaces = workspaces.filter((ws) => ws.id !== req.id);
        this.saveWorkspaces(filteredWorkspaces);

        return {
          success: true,
        } as DeleteResponse;
      }

      case Action.Open: {
        const req = request as OpenRequest;
        const workspace = workspaces.find((ws) => ws.id === req.workspaceId);

        if (!workspace) {
          return {
            success: false,
            error: 'Workspace not found',
          } as any;
        }

        // Update last opened time
        workspace.updateLastOpened();
        this.saveWorkspaces(workspaces);

        return {
          success: true,
          data: { id: Math.floor(Math.random() * 100000) },
        } as OpenResponse;
      }

      case Action.GetStats: {
        const req = request as GetStatsRequest;
        const workspace = workspaces.find((ws) => ws.id === req.workspaceId);

        if (!workspace) {
          return {
            success: false,
            error: 'Workspace not found',
          } as any;
        }

        const stats: WorkspaceStats = {
          totalTabs: workspace.tabs.length + workspace.pinnedTabs.length,
          pinnedTabs: workspace.pinnedTabs.length,
          regularTabs: workspace.tabs.length,
          lastOpened: workspace.lastOpened,
          createdAt: workspace.createdAt,
          isActive: Date.now() - workspace.lastOpened < 300000, // Active if opened within 5 minutes
        };

        return {
          success: true,
          data: stats,
        } as GetStatsResponse;
      }

      case Action.CheckPageInWorkspaces: {
        const req = request as CheckPageInWorkspacesRequest;
        const matcher = (tab: WorkspaceTab) =>
          tab.url.includes(req.url) || req.url.includes(tab.url);
        const matchingWorkspaces = workspaces.filter((workspace) => workspace.tabs.some(matcher));

        return {
          success: true,
          data: matchingWorkspaces,
        } as CheckPageInWorkspacesResponse;
      }

      default:
        return {
          success: false,
          error: `Unknown action: ${action}`,
        } as ErrorResponse;
    }
  }

  private createProxy(path: any[] = []): any {
    const createProxy: typeof this.createProxy = (...args) => this.createProxy(...args);
    const createResponse: typeof this.createResponse = (...args) => this.createResponse(...args);

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
        if (key === 'runtime.sendMessage') {
          return Promise.resolve(createResponse(args[0]));
        }

        return createProxy(path); // 调用后还能继续链式访问
      },
    });
  }
}
export default new MockBrowser();
