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

  interface TriggerImportRequest {
    action: Action.TriggerImport;
  }

  interface FileImportDataRequest {
    action: Action.FileImportData;
    succ: boolean;
    data: string;
  }

  // Union type for all possible requests
  type MessageRequest =
    | OpenRequest
    | ToggleSyncRequest
    | ImportRequest
    | TriggerImportRequest
    | FileImportDataRequest;

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

  interface TriggerImportResponse {
    succ: boolean;
    from: 'content' | 'background' | 'popup';
  }

  type MessageResponse = CommonResponse | ErrorResponse | ImportResponse | TriggerImportResponse;

  type MessageResponseMap = {
    [Action.Open]: CommonResponse;
    [Action.ToggleSync]: CommonResponse;
    [Action.Import]: CommonResponse;
    [Action.TriggerImport]: TriggerImportResponse;
    [Action.FileImportData]: ImportResponse;
  };
}
