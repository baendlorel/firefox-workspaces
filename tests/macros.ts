globalThis.logger = {} as any;
logger.info = console.log;
logger.warn = console.warn;
logger.error = console.error;
logger.debug = console.debug;
logger.succ = (...message: any[]) => console.log('✔️', ...message);
logger.verbose = (...message: any[]) => console.log('🔍', ...message);
logger.WorkspaceNotFound = (id: string) => console.warn(`Workspace not found: ${id}`);
logger.TabNotFoundInWorkspace = (id: string, tabId: number) =>
  console.warn(`Tab not found in workspace ${id}: ${tabId}`);
