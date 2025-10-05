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

  interface ExportRequest {
    action: Action.Export;
  }

  interface ReturnFileDataRequest {
    action: Action.ReturnFileData;
    data: unknown;
  }

  interface OpenPageRequest {
    action: Action.OpenPage;
    page: 'about' | 'donate' | 'import';
  }

  // Union type for all possible requests
  type MessageRequest =
    | OpenRequest
    | ToggleSyncRequest
    | ExportRequest
    | ReturnFileDataRequest
    | OpenPageRequest;

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

  type MessageResponse = CommonResponse | ErrorResponse | ImportResponse;

  type MessageResponseMap = {
    [Action.Open]: CommonResponse;
    [Action.ToggleSync]: CommonResponse;
    [Action.Export]: CommonResponse;
    [Action.ReturnFileData]: ImportResponse;
    [Action.OpenPage]: CommonResponse;
  };
}
