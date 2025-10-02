import { Action } from '@/lib/consts.js';
import { Workspace } from '@/lib/workspace.ts';
import { WorkspaceTab } from '@/lib/workspace-tab.ts';

declare global {
  // #region Request
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
    workspaceId: string;
  }

  interface GetStatsRequest {
    action: Action.GetStats;
    workspaceId: string;
  }

  interface CheckPageInWorkspacesRequest {
    action: Action.CheckPageInWorkspaces;
    url: string;
  }

  interface ExportRequest {
    action: Action.Export;
  }

  interface ImportRequest {
    action: Action.Import;
    data: Workspace[];
  }

  // Union type for all possible requests
  type MessageRequest =
    | GetRequest
    | SaveRequest
    | DeleteRequest
    | OpenRequest
    | GetStatsRequest
    | CheckPageInWorkspacesRequest
    | ExportRequest
    | ImportRequest;
  // #endregion

  // #region Response
  interface GetResponse {
    success: boolean;
    data: Workspace[];
    activated: string[]; // Array of active workspace IDs
  }

  interface SaveResponse {
    success: boolean;
    data: Workspace;
  }

  interface DeleteResponse {
    success: boolean;
  }

  interface AddCurrentTabResponse {
    success: boolean;
    error?: string;
  }

  interface OpenResponse {
    success: boolean;
    data: { id?: number | undefined } | null;
  }

  interface GetStatsResponse {
    success: boolean;
    data?: WorkspaceStats | null;
  }

  interface CheckPageInWorkspacesResponse {
    success: boolean;
    data: Workspace[];
  }

  interface ExportResponse {
    success: boolean;
    data: Workspace[];
  }

  interface ImportResponse {
    success: boolean;
    message?: string;
  }

  interface ErrorResponse {
    success: false;
    error: string;
  }

  interface MessageResponseMap {
    [Action.Get]: GetResponse;
    [Action.Save]: SaveResponse;
    [Action.Delete]: DeleteResponse;
    [Action.Open]: OpenResponse;
    [Action.GetStats]: GetStatsResponse;
    [Action.CheckPageInWorkspaces]: CheckPageInWorkspacesResponse;
    [Action.Export]: ExportResponse;
    [Action.Import]: ImportResponse;
  }

  // #endregion
}
