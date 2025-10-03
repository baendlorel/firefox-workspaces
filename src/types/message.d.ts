import { Action } from '@/lib/consts.js';

declare global {
  // # requests
  interface GetStateRequest {
    action: Action.GetState;
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
    data: WorkspacePersistantWithHash;
  }

  // Union type for all possible requests
  type MessageRequest =
    | GetStateRequest
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

  interface AddCurrentTabResponse extends BaseResponse {
    error?: string;
  }

  interface OpenResponse extends BaseResponse {
    data: { id: number } | null;
  }

  interface CheckPageInWorkspacesResponse extends BaseResponse {
    data: WorkspacePlain[];
  }

  interface ImportResponse extends BaseResponse {}

  interface ErrorResponse extends BaseResponse {
    error: string;
  }

  interface MessageResponseMap {
    [Action.GetState]: GetStateResponse;
    [Action.Open]: OpenResponse;
    [Action.CheckPageInWorkspaces]: CheckPageInWorkspacesResponse;
    [Action.Import]: ImportResponse;
  }
}
