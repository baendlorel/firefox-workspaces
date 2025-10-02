import { Action } from '@/lib/consts.js';
import { Workspace } from '@/lib/workspace.ts';
import { WorkspaceTab } from '@/lib/workspace-tab.ts';

declare global {
  // #region Request
  interface GetStateRequest {
    action: Action.GetState;
  }

  interface GetRequest {
    action: Action.Get;
  }

  interface SaveRequest {
    action: Action.Save;
    data: WorkspaceFormData;
  }

  interface DeleteRequest {
    action: Action.Delete;
    id: string;
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
    | SaveRequest
    | DeleteRequest
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

  interface SaveResponse extends BaseResponse {
    data: Workspace;
  }

  interface DeleteResponse extends BaseResponse {}

  interface AddCurrentTabResponse extends BaseResponse {
    error?: string;
  }

  interface OpenResponse extends BaseResponse {
    data: { id?: number | undefined } | null;
  }

  interface GetStatsResponse extends BaseResponse {
    data?: WorkspaceStats | null;
  }

  interface CheckPageInWorkspacesResponse extends BaseResponse {
    data: Workspace[];
  }

  interface ExportResponse extends BaseResponse {}

  interface ImportResponse extends BaseResponse {
    message?: string;
  }

  interface ErrorResponse extends BaseResponse {
    error: string;
  }

  interface MessageResponseMap {
    [Action.GetState]: GetStateResponse;
    [Action.Get]: GetResponse;
    [Action.Save]: SaveResponse;
    [Action.Delete]: DeleteResponse;
    [Action.Open]: OpenResponse;
    [Action.GetStats]: GetStatsResponse;
    [Action.CheckPageInWorkspaces]: CheckPageInWorkspacesResponse;
    [Action.Import]: ImportResponse;
  }

  // #endregion
}
