import './toolbar.css';
import { Action, WORKSPACE_COLORS } from '@/lib/consts.js';
import { h } from '@/lib/dom.js';
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
      return stored ? JSON.parse(stored) : [];
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
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomColor = WORKSPACE_COLORS[Math.floor(Math.random() * WORKSPACE_COLORS.length)];

    return new Workspace(randomName, randomColor);
  }

  private createSampleTab(): TabInfo {
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
    return {
      id: Math.floor(Math.random() * 100000),
      title: sample.title,
      url: sample.url,
      favIconUrl: sample.favIconUrl,
      pinned: false,
      addedAt: Date.now(),
    };
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
          workspace.pinnedTabs.push(tab);
        } else {
          workspace.tabs.push(tab);
        }
      }
      workspaces.push(workspace);
    }

    this.saveWorkspaces(workspaces);
    console.log('Created 3 random workspaces');
    alert('Created 3 random workspaces!');
  }

  private triggerSetCurrent(): void {
    const tabs = [
      {
        id: 1,
        title: 'Fake Tab 1',
        url: 'https://example.com',
        favIconUrl: 'https://example.com/favicon.ico',
        pinned: true,
        addedAt: Date.now(),
      },
      {
        id: 2,
        title: 'Fake Tab 2',
        url: 'https://github.com',
        favIconUrl: 'https://github.com/favicon.ico',
        pinned: false,
        addedAt: Date.now(),
      },
    ];
    // Create a fake workspace
    const name = `Fake Workspace ${new Date().toLocaleTimeString()}`;
    const color = WORKSPACE_COLORS[Math.floor(Math.random() * WORKSPACE_COLORS.length)];
    const fakeWorkspace: Workspace = new Workspace(name, color);
    fakeWorkspace.tabs = tabs;
    fakeWorkspace.windowId = 999;

    // Trigger set-current event through the global popup instance
    if (window.popup) {
      window.popup.onWindowFocusChanged({
        workspace: fakeWorkspace,
        windowId: NaN,
        action: Action.WindowFocusChanged,
      });
      console.log('Triggered set-current event with fake workspace:', fakeWorkspace);
      alert(`Set current workspace to: ${fakeWorkspace.name}`);
    } else {
      console.error('Popup instance not found on window object');
      alert('Error: Could not access popup instance');
    }
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
      case Action.GetWorkspaces:
        return {
          success: true,
          data: workspaces,
        } as GetWorkspacesResponse;

      case Action.CreateWorkspace: {
        const req = request as CreateWorkspaceRequest;
        const newWorkspace = new Workspace(req.name, req.color);

        workspaces.push(newWorkspace);
        this.saveWorkspaces(workspaces);

        return {
          success: true,
          data: newWorkspace,
        } as CreateWorkspaceResponse;
      }

      case Action.UpdateWorkspace: {
        const req = request as UpdateWorkspaceRequest;
        const workspaceIndex = workspaces.findIndex((ws) => ws.id === req.id);

        if (workspaceIndex === -1) {
          return {
            success: false,
            error: 'Workspace not found',
          } as any;
        }

        workspaces[workspaceIndex] = { ...workspaces[workspaceIndex], ...req.updates };
        this.saveWorkspaces(workspaces);

        return {
          success: true,
          data: workspaces[workspaceIndex],
        } as UpdateWorkspaceResponse;
      }

      case Action.DeleteWorkspace: {
        const req = request as DeleteWorkspaceRequest;
        const filteredWorkspaces = workspaces.filter((ws) => ws.id !== req.id);
        this.saveWorkspaces(filteredWorkspaces);

        return {
          success: true,
        } as DeleteWorkspaceResponse;
      }

      case Action.RemoveTab: {
        const req = request as RemoveTabRequest;
        const workspace = workspaces.find((ws) => ws.id === req.workspaceId);

        if (!workspace) {
          return {
            success: false,
            error: 'Workspace not found',
          } as any;
        }

        workspace.tabs = workspace.tabs.filter((tab) => tab.id !== req.tabId);

        this.saveWorkspaces(workspaces);

        return {
          success: true,
        } as RemoveTabResponse;
      }

      case Action.TogglePin: {
        const req = request as TogglePinRequest;
        const workspace = workspaces.find((ws) => ws.id === req.workspaceId);

        if (!workspace) {
          return {
            success: false,
            error: 'Workspace not found',
          } as any;
        }

        const tabInRegular = workspace.tabs.find((tab) => tab.id === req.tabId);
        if (tabInRegular) {
          tabInRegular.pinned = !tabInRegular.pinned;
        }

        this.saveWorkspaces(workspaces);

        return {
          success: true,
        } as TogglePinResponse;
      }

      case Action.OpenWorkspace: {
        const req = request as OpenWorkspaceRequest;
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
        } as OpenWorkspaceResponse;
      }

      case Action.MoveTab: {
        const req = request as MoveTabRequest;
        const fromWorkspace = workspaces.find((ws) => ws.id === req.fromWorkspaceId);
        const toWorkspace = workspaces.find((ws) => ws.id === req.toWorkspaceId);

        if (!fromWorkspace || !toWorkspace) {
          return {
            success: false,
            error: 'Workspace not found',
          } as any;
        }

        const tabFromRegular = fromWorkspace.tabs.find((tab) => tab.id === req.tabId);

        let movedTab: TabInfo | undefined;

        if (movedTab) {
          toWorkspace.tabs.push(movedTab);
          this.saveWorkspaces(workspaces);
        }

        return {
          success: true,
        } as MoveTabResponse;
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
        const matchingWorkspaces = workspaces.filter((workspace) =>
          [...workspace.tabs, ...workspace.pinnedTabs].some(
            (tab) => tab.url.includes(req.url) || req.url.includes(tab.url)
          )
        );

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
