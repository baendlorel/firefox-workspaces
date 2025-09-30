export class logger extends null {
  static info(func: string, ...message: any[]) {
    console.log(`%c[__NAME__ info] ${func}: `, 'color:blue', ...message);
  }
  static warn(func: string, ...message: any[]) {
    console.log(`%c[__NAME__ warn] ${func}:`, 'color:orange', ...message);
  }
  static error(func: string, ...message: any[]) {
    console.log(`%c[__NAME__ error] ${func}:`, 'color:red', ...message);
  }
  static debug(func: string, message: string) {
    console.log(`%c[__NAME__ debug] ${func}:`, 'color:purple', ...message);
  }
  static WorkspaceNotFound(func: string, id: string) {
    logger.error(func, `Workspace with id ${id} not found`);
  }
  static TabNotFoundInWorkspace(func: string, id: string, tabId: number) {
    logger.error(func, `Tab ${tabId} not found in workspace ${id}`);
  }
}
