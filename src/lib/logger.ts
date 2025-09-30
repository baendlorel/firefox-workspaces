export const logger = {
  info(func: string, ...message: any[]) {
    console.log(`%c[__NAME__] ${func}: `, 'color:blue', ...message);
  },
  warn(func: string, ...message: any[]) {
    console.log(`%c[__NAME__] ${func}:`, 'color:orange', ...message);
  },
  error(func: string, ...message: any[]) {
    console.log(`%c[__NAME__] ${func}:`, 'color:red', ...message);
  },
  debug(func: string, message: string) {
    console.log(`%c[__NAME__] ${func}:`, 'color:purple', ...message);
  },
  WorkspaceNotFound(func: string, id: string) {
    console.warn(`[__NAME__] ${func}: Workspace with id ${id} not found`);
  },
  TabNotFoundInWorkspace(func: string, id: string, tabId: number) {
    console.warn(`[__NAME__] ${func}: Tab ${tabId} not found in workspace ${id}`);
  },
};
