import { describe, it, expect } from 'vitest';
import { $compress, $decompress } from '../src/lib/compress.js';

describe('compress / decompress', () => {
  it('round-trips complex data correctly', () => {
    const sample: any = {
      hash: 'abc123',
      timestamp: 1690000000000,
      settings: { theme: 'light', sync: true },
      workspaces: [
        {
          id: 'w1',
          name: 'Workspace 1',
          color: '#ff0000',
          createdAt: 1600000000000,
          lastOpened: 1690000000000,
          tabs: [
            {
              id: 101,
              index: 0,
              title: 'Hello',
              url: 'https://example.com/?q=测试',
              pinned: false,
            },
            { id: 102, index: 1, title: 'Pinned', url: 'about:blank', pinned: true },
          ],
        },
      ],
    };

    // keep a deep copy of the original to compare after round-trip
    const expected = JSON.parse(JSON.stringify(sample));

    const compressed = $compress(JSON.parse(JSON.stringify(sample)));
    expect(typeof compressed).toBe('string');

    const decompressed = $decompress(compressed);
    expect(decompressed).not.toBeNull();
    expect(decompressed).toEqual(expected);
  });

  it('handles empty workspaces and empty tabs', () => {
    const sample: any = {
      hash: '',
      timestamp: 1,
      settings: { theme: 'dark', sync: false },
      workspaces: [
        {
          id: 'w-empty',
          name: 'Empty',
          color: '#000000',
          createdAt: 0,
          lastOpened: 0,
          tabs: [],
        },
      ],
    };

    const expected = JSON.parse(JSON.stringify(sample));
    const compressed = $compress(JSON.parse(JSON.stringify(sample)));
    const decompressed = $decompress(compressed);
    expect(decompressed).toEqual(expected);
  });

  it('returns null for invalid compressed input', () => {
    const bad = 'not-a-valid-base64-or-lz-string';
    expect($decompress(bad)).toBeNull();
  });
});
