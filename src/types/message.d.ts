export {};

declare global {
  // # requests
  interface OpenRequest {
    action: Action.Open;
    workspace: Workspace;
  }

  interface ReturnFileDataRequest {
    action: Action.ReturnFileData;
    data: unknown;
  }

  interface OpenPageRequest {
    action: Action.OpenPage;
    page: PopupPage;
  }

  interface CaptureTabsRequest {
    action: Action.CaptureTabs;
  }

  interface UpdateTabsRequest {
    action: Action.UpdateTabs;
    workspaceId: string;
    tabs: WorkspaceTab[];
  }

  // Union type for all possible requests
  type MessageRequest =
    | OpenRequest
    | ReturnFileDataRequest
    | OpenPageRequest
    | CaptureTabsRequest
    | UpdateTabsRequest;

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

  interface CaptureTabsResponse extends CommonResponse {
    tabs: WorkspaceTab[];
  }

  type MessageResponse = CommonResponse | ErrorResponse | ImportResponse | CaptureTabsResponse;

  type MessageResponseMap = {
    [Action.Open]: CommonResponse;
    [Action.ReturnFileData]: ImportResponse;
    [Action.OpenPage]: CommonResponse;
    [Action.CaptureTabs]: CaptureTabsResponse;
    [Action.UpdateTabs]: CommonResponse;
  };
}
