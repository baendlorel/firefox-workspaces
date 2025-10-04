import { Action } from '@/lib/consts.js';

declare global {
  // # requests
  interface OpenRequest {
    action: Action.Open;
    workspace: Workspace;
  }

  interface ImportRequest {
    action: Action.Import;
    data: ExportData;
  }

  // Union type for all possible requests
  type MessageRequest = OpenRequest | ImportRequest;

  // # responses
  interface BaseResponse {
    succ: boolean;
  }

  interface ErrorResponse extends BaseResponse {
    error: string;
  }

  interface OpenResponse extends BaseResponse {
    data: { id: number } | null;
  }

  interface ImportResponse extends BaseResponse {}

  type MessageResponse = OpenResponse | ImportResponse | ErrorResponse;

  type MessageResponseMap = {
    [Action.Open]: OpenResponse;
    [Action.Import]: ImportResponse;
  };
}
