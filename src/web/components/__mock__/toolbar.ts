import './toolbar.css';
import { Action, WORKSPACE_COLORS } from '@/lib/consts.js';
import { h } from '@/lib/dom.js';

// # Mock browser API in dev mode

class MockBrowser {
  private shouldSucceed: boolean = true;
  private storageKey = 'mock_workspaces_data';

  constructor() {
    globalThis.browser = this.createProxy() as typeof browser;
    this.createToolbar();
    console.log('MockBrowser init');
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

    return {
      id: `workspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${randomName} ${Math.floor(Math.random() * 100)}`,
      color: randomColor,
      tabs: [],
      pinnedTabs: [],
      createdAt: Date.now(),
      lastOpened: Date.now(),
    };
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
      addedAt: Date.now(),
    };
  }

  private createToolbar(): void {
    let isCollapsed = false;

    // Create checkbox input
    const checkbox = h('input', { type: 'checkbox', checked: 'true' });
    checkbox.checked = this.shouldSucceed;
    checkbox.addEventListener('change', () => (this.shouldSucceed = checkbox.checked));

    // Create buttons
    const clearBtn = h('button', 'mock-browser-btn mock-browser-btn--clear', 'Clear Cache');
    clearBtn.addEventListener('click', () => this.clearCache());

    const createBtn = h('button', 'mock-browser-btn mock-browser-btn--create', 'Random 3 WS');
    createBtn.addEventListener('click', () => this.createRandomWorkspaces());

    // Create toggle button (replaces close button)
    const toggleBtn = h('button', 'mock-browser-btn mock-browser-btn--toggle', '−');

    // Create controls container for elements that can be hidden
    const controls = h('div', 'mock-browser-controls', [
      h('label', 'mock-browser-checkbox-label', [checkbox, h('span', '', 'Success')]),
      clearBtn,
      createBtn,
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

  private createResponse(request: Message): MessageResponse {
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

      case Action.CreateWorkspaces: {
        const req = request as CreateWorkspacesRequest;
        const newWorkspace: Workspace = {
          id: `workspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: req.name,
          color: req.color,
          tabs: [],
          pinnedTabs: [],
          createdAt: Date.now(),
          lastOpened: Date.now(),
        };

        workspaces.push(newWorkspace);
        this.saveWorkspaces(workspaces);

        return {
          success: true,
          data: newWorkspace,
        } as CreateWorkspacesResponse;
      }

      case Action.UpdateWorkspaces: {
        const req = request as UpdateWorkspacesRequest;
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
        } as UpdateWorkspacesResponse;
      }

      case Action.DeleteWorkspaces: {
        const req = request as DeleteWorkspacesRequest;
        const filteredWorkspaces = workspaces.filter((ws) => ws.id !== req.id);
        this.saveWorkspaces(filteredWorkspaces);

        return {
          success: true,
        } as DeleteWorkspacesResponse;
      }

      case Action.AddCurrentTab: {
        const req = request as AddCurrentTabRequest;
        const workspace = workspaces.find((ws) => ws.id === req.workspaceId);

        if (!workspace) {
          return {
            success: false,
            error: 'Workspace not found',
          } as AddCurrentTabResponse;
        }

        const newTab = this.createSampleTab();

        if (req.pinned) {
          workspace.pinnedTabs.push(newTab);
        } else {
          workspace.tabs.push(newTab);
        }

        this.saveWorkspaces(workspaces);

        return {
          success: true,
        } as AddCurrentTabResponse;
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
        workspace.pinnedTabs = workspace.pinnedTabs.filter((tab) => tab.id !== req.tabId);

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
        const tabInPinned = workspace.pinnedTabs.find((tab) => tab.id === req.tabId);

        if (tabInRegular) {
          workspace.tabs = workspace.tabs.filter((tab) => tab.id !== req.tabId);
          workspace.pinnedTabs.push(tabInRegular);
        } else if (tabInPinned) {
          workspace.pinnedTabs = workspace.pinnedTabs.filter((tab) => tab.id !== req.tabId);
          workspace.tabs.push(tabInPinned);
        }

        this.saveWorkspaces(workspaces);

        return {
          success: true,
        } as TogglePinResponse;
      }

      case Action.OpenWorkspaces: {
        const req = request as OpenWorkspacesRequest;
        const workspace = workspaces.find((ws) => ws.id === req.workspaceId);

        if (!workspace) {
          return {
            success: false,
            error: 'Workspace not found',
          } as any;
        }

        // Update last opened time
        workspace.lastOpened = Date.now();
        this.saveWorkspaces(workspaces);

        return {
          success: true,
          data: { id: Math.floor(Math.random() * 100000) },
        } as OpenWorkspacesResponse;
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
        const tabFromPinned = fromWorkspace.pinnedTabs.find((tab) => tab.id === req.tabId);

        let movedTab: TabInfo | undefined;

        if (tabFromRegular) {
          fromWorkspace.tabs = fromWorkspace.tabs.filter((tab) => tab.id !== req.tabId);
          movedTab = tabFromRegular;
        } else if (tabFromPinned) {
          fromWorkspace.pinnedTabs = fromWorkspace.pinnedTabs.filter((tab) => tab.id !== req.tabId);
          movedTab = tabFromPinned;
        }

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

      case Action.CheckPageInGroups: {
        const req = request as CheckPageInGroupsRequest;
        const matchingWorkspaces = workspaces.filter((workspace) =>
          [...workspace.tabs, ...workspace.pinnedTabs].some(
            (tab) => tab.url.includes(req.url) || req.url.includes(tab.url)
          )
        );

        return {
          success: true,
          groups: matchingWorkspaces,
        } as CheckPageInGroupsResponse;
      }

      default:
        return {
          success: false,
          error: `Unknown action: ${action}`,
        } as UnknownActionResponse;
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
