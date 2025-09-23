export const enum Consts {
  StorageKey = 'workspaces',
  InjectionFlag = 'kasukabe_tsumugi_workspaces_content_loaded',
}

export const enum Action {
  GetWorkspacess = 'GetWorkspacess',
  CreateWorkspaces = 'CreateWorkspaces',
  UpdateWorkspaces = 'UpdateWorkspaces',
  DeleteWorkspaces = 'DeleteWorkspaces',
  AddCurrentTab = 'AddCurrentTab',
  RemoveTab = 'RemoveTab',
  TogglePin = 'TogglePin',
  OpenWorkspaces = 'OpenWorkspaces',
  MoveTab = 'MoveTab',
  GetGroupStats = 'GetGroupStats',
  CheckPageInGroups = 'CheckPageInGroups',
}
