import { compressToBase64, decompressFromBase64 } from 'lz-string';

// # field order
const FExportData: (keyof Persist)[] = ['workspaces', 'settings', 'timestamp'];
const FWorkspace: (keyof Workspace)[] = [
  'id',
  'name',
  'color',
  'tabs',
  'createdAt',
  'lastOpened',
  'password',
  'passpeek',
  'lockUntil',
  'failedAttempts',
];
const FWorkspaceTabPlain: (keyof WorkspaceTab)[] = ['id', 'index', 'title', 'url', 'pinned'];

function serialize<T>(obj: T, fieldOrder: (keyof T)[]): any {
  return fieldOrder.map((key) => obj[key]);
}

function deserialize<T>(arr: any[], fieldOrder: (keyof T)[]): T {
  const res: any = {};
  for (let i = 0; i < fieldOrder.length; i++) {
    const key = fieldOrder[i];
    res[key] = arr[i];
  }
  return res;
}

export function $compress(data: ExportData): string {
  for (let i = 0; i < data.workspaces.length; i++) {
    data.workspaces[i].tabs = data.workspaces[i].tabs.map((t) => serialize(t, FWorkspaceTabPlain));
  }
  data.workspaces = data.workspaces.map((w) => serialize(w, FWorkspace));
  const serialized = serialize(data, FExportData);
  const compressed = compressToBase64(JSON.stringify(serialized));
  logger.info(
    'Original data length:',
    JSON.stringify(data).length,
    'serialized length:',
    JSON.stringify(serialized).length,
    'compressed length:',
    compressed.length
  );
  return compressed;
}

export function $decompress(compressed: string): ExportData | null {
  try {
    const decompressed = decompressFromBase64(compressed);
    const serialized = JSON.parse(decompressed);
    const data = deserialize(serialized, FExportData);
    data.workspaces = data.workspaces.map((wArr: any[]) => {
      const w = deserialize(wArr, FWorkspace);
      w.tabs = w.tabs.map((tArr: any[]) => deserialize(tArr, FWorkspaceTabPlain));
      return w;
    });
    return data;
  } catch (error) {
    logger.error('Decompression or parsing failed:', error);
    return null;
  }
}
