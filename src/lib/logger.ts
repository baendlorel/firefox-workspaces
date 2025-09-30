export const logger = {
  warn(func: string, message: string) {
    console.warn(`[__NAME__] ${func}: ${message}`);
  },
  WorkspaceNotFound(func: string, id: string) {
    console.warn(`[__NAME__] ${func}: Workspace with id ${id} not found`);
  },
  TabNotFoundInWorkspace(func: string, id: string, tabId: number) {
    console.warn(`[__NAME__] ${func}: Tab ${tabId} not found in workspace ${id}`);
  },
};
