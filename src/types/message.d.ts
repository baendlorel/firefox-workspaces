import { Action } from '@/lib/consts.js';
import { Workspace } from '@/lib/workspace.ts';

declare global {
  // #region Request
  interface GetStateRequest {
    action: Action.GetState;
  }

  interface GetRequest {
    action: Action.Get;
  }

  interface OpenRequest {
    action: Action.Open;
    workspace: Workspace;
  }

  interface GetStatsRequest {
    action: Action.GetStats;
    workspaceId: string;
  }

  interface CheckPageInWorkspacesRequest {
    action: Action.CheckPageInWorkspaces;
    url: string;
  }

  interface ImportRequest {
    action: Action.Import;
    data: Workspace[];
  }

  // Union type for all possible requests
  type MessageRequest =
    | GetStateRequest
    | GetRequest
    | OpenRequest
    | GetStatsRequest
    | CheckPageInWorkspacesRequest
    | ImportRequest;
  // #endregion

  // #region Response
  interface BaseResponse {
    succ: boolean;
  }

  interface GetStateResponse extends BaseResponse {
    data: WorkspaceState;
  }

  interface GetResponse extends BaseResponse {
    data: Workspace[];
    activated: string[]; // Array of active workspace IDs
  }

  interface AddCurrentTabResponse extends BaseResponse {
    error?: string;
  }

  interface OpenResponse extends BaseResponse {
    data: { id: number } | null;
  }

  interface GetStatsResponse extends BaseResponse {
    data?: WorkspaceStats | null;
  }

  interface CheckPageInWorkspacesResponse extends BaseResponse {
    data: Workspace[];
  }

  interface ImportResponse extends BaseResponse {
    message?: string;
  }

  interface ErrorResponse extends BaseResponse {
    error: string;
  }

  interface MessageResponseMap {
    [Action.GetState]: GetStateResponse;
    [Action.Get]: GetResponse;
    [Action.Open]: OpenResponse;
    [Action.GetStats]: GetStatsResponse;
    [Action.CheckPageInWorkspaces]: CheckPageInWorkspacesResponse;
    [Action.Import]: ImportResponse;
  }

  // #endregion
}
