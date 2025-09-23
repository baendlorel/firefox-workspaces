type HexColor = `#${string}`;

interface Workspace {
  id: string;
  name: string;
  color: HexColor;
  tabs: TabInfo[];
  pinnedTabs: TabInfo[];
  createdAt: number;
  lastOpened: number;
  windowId?: number; // Track associated window
}

/**
 * For quicker access to the workspace data with `_map` and `_arr` in `WorkspaceManager`
 */
type IndexedWorkspace = Workspace & { index: number };

interface WorkspaceStoredData {
  list: Workspace[];
}

interface TabInfo {
  id: number;
  title: string;
  url: string;
  favIconUrl: string;
  addedAt: number;
}

interface WorkspaceStats {
  totalTabs: number;
  pinnedTabs: number;
  regularTabs: number;
  lastOpened: number;
  createdAt: number;
  isActive: boolean;
}

interface ExportData {
  version: string;
  exportDate: number;
  workspaceses: Workspace[];
}
