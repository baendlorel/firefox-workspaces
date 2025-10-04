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
    data: ExportData;
  }

  // Union type for all possible requests
  type MessageRequest = OpenRequest | ToggleSyncRequest | ImportRequest;

  // # responses
  interface ErrorResponse {
    succ: false;
    error: string;
  }

  interface CommonResponse {
    succ: boolean;
  }

  type MessageResponse = CommonResponse | ErrorResponse;

  type MessageResponseMap = {
    [Action.Open]: CommonResponse;
    [Action.ToggleSync]: CommonResponse;
    [Action.Import]: CommonResponse;
  };
}
