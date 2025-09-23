// #region Request
// #endregion

// #region Response
interface GetWorkspacesResponse {
  success: boolean;
  data: Workspace[];
}

interface CreateWorkspacesResponse {
  success: boolean;
  data: Workspace;
}

interface UpdateWorkspacesResponse {
  success: boolean;
  data: Workspace | null;
}

interface DeleteWorkspacesResponse {
  success: boolean;
}

interface AddCurrentTabResponse {
  success: boolean;
  error?: string;
}

interface RemoveTabResponse {
  success: boolean;
}

interface TogglePinResponse {
  success: boolean;
}

interface OpenWorkspacesResponse {
  success: boolean;
  data: {
    // ? 这里不要紧吗？
    id?: number | undefined;
  } | null;
}

interface MoveTabResponse {
  success: boolean;
}

interface GetGroupStatsResponse {
  success: boolean;
  data?: WorkspaceStats | null;
}

interface CheckPageInGroupsResponse {
  success: boolean;
  groups: Workspace[];
}

interface UnknownActionResponse {
  success: false;
  error: string;
}

// Union type for all possible responses
type BackgroundResponse =
  | GetWorkspacesResponse
  | CreateWorkspacesResponse
  | UpdateWorkspacesResponse
  | DeleteWorkspacesResponse
  | AddCurrentTabResponse
  | RemoveTabResponse
  | TogglePinResponse
  | OpenWorkspacesResponse
  | MoveTabResponse
  | GetGroupStatsResponse
  | CheckPageInGroupsResponse
  | UnknownActionResponse;

// #endregion
