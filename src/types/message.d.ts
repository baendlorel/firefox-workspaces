import { Action } from '@/lib/consts.js';
import { Workspace } from '@/lib/workspace.ts';
import { WorkspaceTab } from '@/lib/workspace-tab.ts';

declare global {
  // #region Request
  interface GetRequest {
    action: Action.Get;
  }

  interface CreateRequest {
    action: Action.Create;
    name: string;
    color: HexColor;
    tabs: WorkspaceTab[];
  }

  interface UpdateRequest {
    action: Action.Update;
    id: string;
    updates: Partial<Workspace>;
  }

  interface DeleteRequest {
    action: Action.Delete;
    id: string;
  }

  interface OpenRequest {
    action: Action.Open;
    workspaceId: string;
  }

  interface MoveTabRequest {
    action: Action.MoveTab;
    fromWorkspaceId: string;
    toWorkspaceId: string;
    tabId: number;
  }

  interface GetStatsRequest {
    action: Action.GetStats;
    workspaceId: string;
  }

  interface CheckPageInWorkspacesRequest {
    action: Action.CheckPageInWorkspaces;
    url: string;
  }

  interface WindowFocusChangedNotification {
    action: Action.WindowFocusChanged;
    windowId: number;
    workspace: Workspace;
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
    | CreateRequest
    | UpdateRequest
    | DeleteRequest
    | OpenRequest
    | MoveTabRequest
    | GetStatsRequest
    | CheckPageInWorkspacesRequest
    | ExportRequest
    | ImportRequest;
  // #endregion

  // #region Response
  interface GetResponse {
    success: boolean;
    data: Workspace[];
    activeWorkspaces?: string[]; // Array of active workspace IDs
  }

  interface CreateResponse {
    success: boolean;
    data: Workspace;
  }

  interface UpdateResponse {
    success: boolean;
    data: Workspace | null;
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
    data: {
      // ? 这里不要紧吗？
      id?: number | undefined;
    } | null;
  }

  interface MoveTabResponse {
    success: boolean;
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

  // Union type for all possible responses
  type MessageResponse =
    | GetResponse
    | CreateResponse
    | UpdateResponse
    | DeleteResponse
    | AddCurrentTabResponse
    | OpenResponse
    | MoveTabResponse
    | GetStatsResponse
    | CheckPageInWorkspacesResponse
    | ExportResponse
    | ImportResponse
    | ErrorResponse;

  interface MessageResponseMap {
    [Action.Get]: GetResponse;
    [Action.Create]: CreateResponse;
    [Action.Update]: UpdateResponse;
    [Action.Delete]: DeleteResponse;
    [Action.Open]: OpenResponse;
    [Action.MoveTab]: MoveTabResponse;
    [Action.GetStats]: GetStatsResponse;
    [Action.CheckPageInWorkspaces]: CheckPageInWorkspacesResponse;
    [Action.Export]: ExportResponse;
    [Action.Import]: ImportResponse;
  }

  // #endregion
}
