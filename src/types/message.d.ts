import { Action, Switch } from '@/lib/consts.js';

declare global {
  // # requests
  interface OpenRequest {
    action: Action.Open;
    workspace: Workspace;
  }

  interface ToggleSyncRequest {
    action: Action.ToggleSync;
    sync: Switch;
  }

  interface ImportRequest {
    action: Action.Import;
  }

  interface OpenFileInputRequest {
    action: Action.OpenFileInput;
  }

  interface ReturnFileDataRequest {
    action: Action.ReturnFileData;
    succ: boolean;
    data: string;
    requestId: string;
  }

  // Union type for all possible requests
  type MessageRequest =
    | OpenRequest
    | ToggleSyncRequest
    | ImportRequest
    | OpenFileInputRequest
    | ReturnFileDataRequest;

  // # responses
  interface ErrorResponse {
    succ: false;
    error: string;
  }

  interface CommonResponse {
    succ: boolean;
  }

  interface ImportResponse extends CommonResponse {
    message: string;
    addedCount: number;
  }

  interface OpenFileInputResponse {
    succ: boolean;
    from: 'content' | 'background' | 'popup';
  }

  type MessageResponse = CommonResponse | ErrorResponse | ImportResponse | OpenFileInputResponse;

  type MessageResponseMap = {
    [Action.Open]: CommonResponse;
    [Action.ToggleSync]: CommonResponse;
    [Action.Import]: CommonResponse;
    [Action.OpenFileInput]: OpenFileInputResponse;
    [Action.ReturnFileData]: ImportResponse;
  };
}
