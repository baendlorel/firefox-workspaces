type HexColor = `#${string}`;

interface WorkspaceEntry {
  id: string;
  name: string;
  color: HexColor;
  tabs: unknown[];
  pinnedTabs: unknown[];
  createdAt: number;
  lastOpened: unknown;
  windowId: null; // Track associated window
}

interface WorkspaceStoredData {
  list: WorkspaceEntry[];
}
