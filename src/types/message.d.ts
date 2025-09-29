import { Action } from '../lib/consts.js';

declare global {
  // #region Request
  interface GetWorkspacesRequest {
    action: Action.GetWorkspaces;
  }

  interface CreateWorkspaceRequest {
    action: Action.CreateWorkspace;
    name: string;
    color: HexColor;
  }

  interface UpdateWorkspaceRequest {
    action: Action.UpdateWorkspace;
    id: string;
    updates: Partial<Workspace>;
  }

  interface DeleteWorkspaceRequest {
    action: Action.DeleteWorkspace;
    id: string;
  }

  interface AddCurrentTabRequest {
    action: Action.AddCurrentTab;
    workspaceId: string;
    pinned: boolean;
  }

  interface RemoveTabRequest {
    action: Action.RemoveTab;
    workspaceId: string;
    tabId: number;
  }

  interface TogglePinRequest {
    action: Action.TogglePin;
    workspaceId: string;
    tabId: number;
  }

  interface OpenWorkspaceRequest {
    action: Action.OpenWorkspace;
    workspaceId: string;
  }

  interface MoveTabRequest {
    action: Action.MoveTab;
    fromWorkspaceId: string;
    toWorkspaceId: string;
    tabId: number;
  }

  interface GetStatsRequest {
    action: Action.GetStats;
    workspaceId: string;
  }

  interface CheckPageInGroupsRequest {
    action: Action.CheckPageInGroups;
    url: string;
  }

  interface WindowFocusChangedNotification {
    action: Action.WindowFocusChanged;
    windowId: number;
    workspaceName?: string;
  }

  // Union type for all possible requests
  type MessageRequest =
    | GetWorkspacesRequest
    | CreateWorkspaceRequest
    | UpdateWorkspaceRequest
    | DeleteWorkspaceRequest
    | AddCurrentTabRequest
    | RemoveTabRequest
    | TogglePinRequest
    | OpenWorkspaceRequest
    | MoveTabRequest
    | GetStatsRequest
    | CheckPageInGroupsRequest;
  // #endregion

  // #region Response
  interface GetWorkspacesResponse {
    success: boolean;
    data: Workspace[];
    activeWorkspaces?: string[]; // Array of active workspace IDs
  }

  interface CreateWorkspaceResponse {
    success: boolean;
    data: Workspace;
  }

  interface UpdateWorkspaceResponse {
    success: boolean;
    data: Workspace | null;
  }

  interface DeleteWorkspaceResponse {
    success: boolean;
  }

  interface AddCurrentTabResponse {
    success: boolean;
    error?: string;
  }

  interface RemoveTabResponse {
    success: boolean;
  }

  interface TogglePinResponse {
    success: boolean;
  }

  interface OpenWorkspaceResponse {
    success: boolean;
    data: {
      // ? 这里不要紧吗？
      id?: number | undefined;
    } | null;
  }

  interface MoveTabResponse {
    success: boolean;
  }

  interface GetStatsResponse {
    success: boolean;
    data?: WorkspaceStats | null;
  }

  interface CheckPageInGroupsResponse {
    success: boolean;
    groups: Workspace[];
  }

  interface ErrorResponse {
    success: false;
    error: string;
  }

  // Union type for all possible responses
  type MessageResponse =
    | GetWorkspacesResponse
    | CreateWorkspaceResponse
    | UpdateWorkspaceResponse
    | DeleteWorkspaceResponse
    | AddCurrentTabResponse
    | RemoveTabResponse
    | TogglePinResponse
    | OpenWorkspaceResponse
    | MoveTabResponse
    | GetStatsResponse
    | CheckPageInGroupsResponse
    | ErrorResponse;

  interface MessageResponseMap {
    [Action.GetWorkspaces]: GetWorkspacesResponse;
    [Action.CreateWorkspace]: CreateWorkspaceResponse;
    [Action.UpdateWorkspace]: UpdateWorkspaceResponse;
    [Action.DeleteWorkspace]: DeleteWorkspaceResponse;
    [Action.AddCurrentTab]: AddCurrentTabResponse;
    [Action.RemoveTab]: RemoveTabResponse;
    [Action.TogglePin]: TogglePinResponse;
    [Action.OpenWorkspace]: OpenWorkspaceResponse;
    [Action.MoveTab]: MoveTabResponse;
    [Action.GetStats]: GetStatsResponse;
    [Action.CheckPageInGroups]: CheckPageInGroupsResponse;
  }

  // #endregion
}
