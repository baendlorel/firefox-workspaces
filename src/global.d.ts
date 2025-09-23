type HexColor = `#${string}`;

interface Workspace {
  id: string;
  name: string;
  color: HexColor;
  tabs: Tab[];
  pinnedTabs: Tab[];
  createdAt: number;
  lastOpened: Tab;
  windowId: null; // Track associated window
}

interface WorkspaceStoredData {
  list: Workspace[];
}

interface Tab {
  id: number;
  title: string;
  url: string;
  favIconUrl: string;
  addedAt: number;
}
