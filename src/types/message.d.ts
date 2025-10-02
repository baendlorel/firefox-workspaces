import { Action } from '@/lib/consts.js';

declare global {
  // # requests
  interface GetStateRequest {
    action: Action.GetState;
  }

  interface GetRequest {
    action: Action.Get;
  }

  interface OpenRequest {
    action: Action.Open;
    workspace: WorkspacePlain;
  }

  interface CheckPageInWorkspacesRequest {
    action: Action.CheckPageInWorkspaces;
    url: string;
  }

  interface ImportRequest {
    action: Action.Import;
    data: WorkspaceState;
  }

  // Union type for all possible requests
  type MessageRequest =
    | GetStateRequest
    | GetRequest
    | OpenRequest
    | CheckPageInWorkspacesRequest
    | ImportRequest;

  // # responses
  interface BaseResponse {
    succ: boolean;
  }

  interface GetStateResponse extends BaseResponse {
    data: WorkspaceState;
  }

  interface GetResponse extends BaseResponse {
    data: WorkspacePlain[];
    activated: string[]; // Array of active workspace IDs
  }

  interface AddCurrentTabResponse extends BaseResponse {
    error?: string;
  }

  interface OpenResponse extends BaseResponse {
    data: { id: number } | null;
  }

  interface CheckPageInWorkspacesResponse extends BaseResponse {
    data: WorkspacePlain[];
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
    [Action.CheckPageInWorkspaces]: CheckPageInWorkspacesResponse;
    [Action.Import]: ImportResponse;
  }
}
