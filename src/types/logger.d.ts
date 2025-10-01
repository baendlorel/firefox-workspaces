declare namespace logger {
  function info(...message: any[]): void;
  function warn(...message: any[]): void;
  function error(...message: any[]): void;
  function debug(...message: any[]): void;
  function succ(...message: any[]): void;
  function verbose(...message: any[]): void;
  function WorkspaceNotFound(id: string): void;
  function TabNotFoundInWorkspace(id: string, tabId: number): void;
}
