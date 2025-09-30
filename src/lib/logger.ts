export class logger extends null {
  static info(...message: any[]) {}

  static warn(...message: any[]) {}

  static error(...message: any[]) {}

  static debug(...message: any[]) {}

  static WorkspaceNotFound(id: string) {
    logger.error(`Workspace not found, id:`, id);
  }
  static TabNotFoundInWorkspace(id: string, tabId: number) {
    logger.error(`Tab not found in workspace. tabid: ${tabId}, id: ${id}`);
  }
}
