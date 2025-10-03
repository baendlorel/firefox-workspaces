import { Action } from '@/lib/consts.js';

declare global {
  // # requests
  interface GetStateRequest {
    action: Action.GetState;
  }

  interface OpenRequest {
    action: Action.Open;
    workspace: Workspace;
  }

  interface ImportRequest {
    action: Action.Import;
    data: ExportData;
  }

  // Union type for all possible requests
  type MessageRequest = GetStateRequest | OpenRequest | ImportRequest;

  // # responses
  interface BaseResponse {
    succ: boolean;
  }

  interface ErrorResponse extends BaseResponse {
    error: string;
  }

  interface GetStateResponse extends BaseResponse {
    data: State;
  }

  interface OpenResponse extends BaseResponse {
    data: { id: number } | null;
  }

  interface ImportResponse extends BaseResponse {}

  interface MessageResponseMap {
    [Action.GetState]: GetStateResponse;
    [Action.Open]: OpenResponse;
    [Action.Import]: ImportResponse;
  }
}
