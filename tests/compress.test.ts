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
        {
          id: 'w-emptyasdf',
          name: 'Empty34f3',
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

  it('handles a large workspaces array (10 workspaces, 5-20 tabs each)', () => {
    const workspaces = Array.from({ length: 10 }).map((_, wi) => {
      const tabsCount = 5 + ((wi * 3) % 16); // yields values in [5,20]
      const tabs = Array.from({ length: tabsCount }).map((__, ti) => ({
        id: wi * 1000 + ti + 1,
        index: ti,
        title: `Tab ${wi + 1}-${ti + 1}`,
        url: `https://example.com/workspace/${wi + 1}/tab/${ti + 1}?q=${encodeURIComponent('测试')}`,
        pinned: ti % 7 === 0,
      }));

      return {
        id: `w${wi + 1}`,
        name: `Workspace ${wi + 1}`,
        color: `#${((wi * 1234567) % 0xffffff).toString(16).padStart(6, '0')}`,
        createdAt: Date.now() - wi * 1000,
        lastOpened: Date.now() - wi * 500,
        tabs,
      };
    });

    const sample: any = {
      hash: 'bigtest',
      timestamp: Date.now(),
      settings: { theme: 'light', sync: false },
      workspaces,
    };

    const compressed = $compress(JSON.parse(JSON.stringify(sample)));
    expect(typeof compressed).toBe('string');
    const decompressed = $decompress(compressed);
    expect(decompressed).not.toBeNull();
    expect(decompressed).toEqual(sample);
  });
});
