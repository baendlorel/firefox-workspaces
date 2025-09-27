import { Action } from '../lib/consts.js';

declare global {
  // #region Request
  interface GetWorkspacesRequest {
    action: Action.GetWorkspaces;
  }

  interface CreateWorkspacesRequest {
    action: Action.CreateWorkspaces;
    name: string;
    color: HexColor;
  }

  interface UpdateWorkspacesRequest {
    action: Action.UpdateWorkspaces;
    id: string;
    updates: Partial<Workspace>;
  }

  interface DeleteWorkspacesRequest {
    action: Action.DeleteWorkspaces;
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

  interface OpenWorkspacesRequest {
    action: Action.OpenWorkspaces;
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

  // Union type for all possible requests
  type Message =
    | GetWorkspacesRequest
    | CreateWorkspacesRequest
    | UpdateWorkspacesRequest
    | DeleteWorkspacesRequest
    | AddCurrentTabRequest
    | RemoveTabRequest
    | TogglePinRequest
    | OpenWorkspacesRequest
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

  interface CreateWorkspacesResponse {
    success: boolean;
    data: Workspace;
  }

  interface UpdateWorkspacesResponse {
    success: boolean;
    data: Workspace | null;
  }

  interface DeleteWorkspacesResponse {
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

  interface OpenWorkspacesResponse {
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

  interface UnknownActionResponse {
    success: false;
    error: string;
  }

  // Union type for all possible responses
  type MessageResponse =
    | GetWorkspacesResponse
    | CreateWorkspacesResponse
    | UpdateWorkspacesResponse
    | DeleteWorkspacesResponse
    | AddCurrentTabResponse
    | RemoveTabResponse
    | TogglePinResponse
    | OpenWorkspacesResponse
    | MoveTabResponse
    | GetStatsResponse
    | CheckPageInGroupsResponse
    | UnknownActionResponse;

  interface MessageResponseMap {
    [Action.GetWorkspaces]: GetWorkspacesResponse;
    [Action.CreateWorkspaces]: CreateWorkspacesResponse;
    [Action.UpdateWorkspaces]: UpdateWorkspacesResponse;
    [Action.DeleteWorkspaces]: DeleteWorkspacesResponse;
    [Action.AddCurrentTab]: AddCurrentTabResponse;
    [Action.RemoveTab]: RemoveTabResponse;
    [Action.TogglePin]: TogglePinResponse;
    [Action.OpenWorkspaces]: OpenWorkspacesResponse;
    [Action.MoveTab]: MoveTabResponse;
    [Action.GetStats]: GetStatsResponse;
    [Action.CheckPageInGroups]: CheckPageInGroupsResponse;
  }

  // #endregion
}
