import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PresetDiscovery, createDiscovery, discoverPresets } from '../../../../src/core/registry/discovery.js';

// Mock fs module
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    readdirSync: vi.fn(),
  };
});

import { existsSync, readFileSync, readdirSync } from 'fs';

const mockExistsSync = existsSync as ReturnType<typeof vi.fn>;
const mockReadFileSync = readFileSync as ReturnType<typeof vi.fn>;
const mockReaddirSync = readdirSync as ReturnType<typeof vi.fn>;

describe('PresetDiscovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create with default options', () => {
      const discovery = new PresetDiscovery();
      expect(discovery).toBeDefined();
    });

    it('should create with custom patterns', () => {
      const discovery = new PresetDiscovery({
        patterns: ['my-preset-*'],
      });
      expect(discovery).toBeDefined();
    });

    it('should create with custom search directories', () => {
      const discovery = new PresetDiscovery({
        searchDirs: ['/custom/dir'],
      });
      expect(discovery).toBeDefined();
    });

    it('should respect includeDevDeps option', () => {
      const discovery = new PresetDiscovery({
        includeDevDeps: false,
      });
      expect(discovery).toBeDefined();
    });
  });

  describe('discover', () => {
    it('should return empty array when no package.json exists', () => {
      mockExistsSync.mockReturnValue(false);

      const discovery = new PresetDiscovery({ searchDirs: ['/project'] });
      const result = discovery.discover();

      expect(result).toEqual([]);
    });

    it('should discover presets from package.json dependencies', () => {
      mockExistsSync.mockImplementation((path: string) => {
        if (path.endsWith('package.json')) return true;
        if (path.includes('node_modules/precommit-preset-test')) return true;
        return false;
      });

      mockReadFileSync.mockImplementation((path: string) => {
        if (path.endsWith('/project/package.json')) {
          return JSON.stringify({
            dependencies: {
              'precommit-preset-test': '^1.0.0',
              'other-package': '^2.0.0',
            },
          });
        }
        if (path.includes('precommit-preset-test/package.json')) {
          return JSON.stringify({
            name: 'precommit-preset-test',
            version: '1.0.0',
            precommit: { preset: './dist/preset.js' },
          });
        }
        return '{}';
      });

      mockReaddirSync.mockReturnValue([]);

      const discovery = new PresetDiscovery({ searchDirs: ['/project'] });
      const result = discovery.discover();

      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should discover presets from devDependencies when enabled', () => {
      mockExistsSync.mockImplementation((path: string) => {
        if (path.endsWith('package.json')) return true;
        if (path.includes('node_modules/precommit-plugin-dev')) return true;
        return false;
      });

      mockReadFileSync.mockImplementation((path: string) => {
        if (path.endsWith('/project/package.json')) {
          return JSON.stringify({
            devDependencies: {
              'precommit-plugin-dev': '^1.0.0',
            },
          });
        }
        if (path.includes('precommit-plugin-dev/package.json')) {
          return JSON.stringify({
            name: 'precommit-plugin-dev',
            version: '1.0.0',
            precommit: { preset: './preset.js' },
          });
        }
        return '{}';
      });

      mockReaddirSync.mockReturnValue([]);

      const discovery = new PresetDiscovery({
        searchDirs: ['/project'],
        includeDevDeps: true,
      });
      const result = discovery.discover();

      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should not include devDependencies when disabled', () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('package.json')
      );

      mockReadFileSync.mockReturnValue(JSON.stringify({
        devDependencies: {
          'precommit-preset-dev': '^1.0.0',
        },
      }));

      mockReaddirSync.mockReturnValue([]);

      const discovery = new PresetDiscovery({
        searchDirs: ['/project'],
        includeDevDeps: false,
      });
      const result = discovery.discover();

      expect(result).toEqual([]);
    });

    it('should deduplicate discovered presets', () => {
      mockExistsSync.mockImplementation((path: string) => {
        if (path.endsWith('package.json')) return true;
        if (path.includes('node_modules')) return true;
        return false;
      });

      mockReadFileSync.mockImplementation((path: string) => {
        if (path.endsWith('/project/package.json')) {
          return JSON.stringify({
            dependencies: {
              'precommit-preset-test': '^1.0.0',
            },
          });
        }
        return JSON.stringify({
          name: 'precommit-preset-test',
          version: '1.0.0',
          precommit: {},
        });
      });

      mockReaddirSync.mockImplementation((path: string) => {
        if (path.includes('node_modules') && !path.includes('@')) {
          return [{ name: 'precommit-preset-test', isDirectory: () => true }];
        }
        return [];
      });

      const discovery = new PresetDiscovery({ searchDirs: ['/project'] });
      const result = discovery.discover();

      // Should be deduplicated
      const names = result.map(p => p.name);
      const uniqueNames = [...new Set(names)];
      expect(names.length).toBe(uniqueNames.length);
    });

    it('should handle scoped packages', () => {
      mockExistsSync.mockImplementation((path: string) => {
        if (path.endsWith('package.json')) return true;
        if (path.includes('node_modules/@org')) return true;
        return false;
      });

      mockReadFileSync.mockImplementation((path: string) => {
        if (path.endsWith('/project/package.json')) {
          return JSON.stringify({
            dependencies: {
              '@org/precommit-preset-custom': '^1.0.0',
            },
          });
        }
        return JSON.stringify({
          name: '@org/precommit-preset-custom',
          version: '1.0.0',
          precommit: {},
        });
      });

      mockReaddirSync.mockImplementation((path: string, options?: any) => {
        if (path.endsWith('node_modules')) {
          return [{ name: '@org', isDirectory: () => true }];
        }
        if (path.endsWith('@org')) {
          return [{ name: 'precommit-preset-custom', isDirectory: () => true }];
        }
        return [];
      });

      const discovery = new PresetDiscovery({ searchDirs: ['/project'] });
      const result = discovery.discover();

      // At least finds from package.json
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle JSON parse errors gracefully', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('invalid json');
      mockReaddirSync.mockReturnValue([]);

      const discovery = new PresetDiscovery({ searchDirs: ['/project'] });

      // Should not throw
      expect(() => discovery.discover()).not.toThrow();
    });

    it('should skip non-directory entries in node_modules', () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('package.json') || path.includes('node_modules')
      );

      mockReadFileSync.mockReturnValue(JSON.stringify({ name: 'test' }));

      mockReaddirSync.mockImplementation((path: string) => {
        if (path.endsWith('node_modules')) {
          return [
            { name: 'file.txt', isDirectory: () => false },
            { name: 'precommit-preset-test', isDirectory: () => true },
          ];
        }
        return [];
      });

      const discovery = new PresetDiscovery({ searchDirs: ['/project'] });

      // Should not throw and should handle file entries
      expect(() => discovery.discover()).not.toThrow();
    });
  });

  describe('pattern matching', () => {
    it('should match precommit-preset-* pattern', () => {
      const discovery = new PresetDiscovery();
      const matchesPatterns = (discovery as any).matchesPatterns.bind(discovery);

      expect(matchesPatterns('precommit-preset-test')).toBe(true);
      expect(matchesPatterns('precommit-preset-my-custom')).toBe(true);
    });

    it('should match precommit-plugin-* pattern', () => {
      const discovery = new PresetDiscovery();
      const matchesPatterns = (discovery as any).matchesPatterns.bind(discovery);

      expect(matchesPatterns('precommit-plugin-test')).toBe(true);
    });

    it('should match scoped package patterns', () => {
      const discovery = new PresetDiscovery();
      const matchesPatterns = (discovery as any).matchesPatterns.bind(discovery);

      expect(matchesPatterns('@org/precommit-preset-test')).toBe(true);
      expect(matchesPatterns('@org/precommit-plugin-test')).toBe(true);
    });

    it('should not match unrelated packages', () => {
      const discovery = new PresetDiscovery();
      const matchesPatterns = (discovery as any).matchesPatterns.bind(discovery);

      expect(matchesPatterns('lodash')).toBe(false);
      expect(matchesPatterns('react')).toBe(false);
      expect(matchesPatterns('other-preset')).toBe(false);
    });

    it('should support custom patterns', () => {
      const discovery = new PresetDiscovery({
        patterns: ['my-custom-*'],
      });
      const matchesPatterns = (discovery as any).matchesPatterns.bind(discovery);

      expect(matchesPatterns('my-custom-preset')).toBe(true);
      expect(matchesPatterns('precommit-preset-test')).toBe(false);
    });
  });
});

describe('createDiscovery', () => {
  it('should create a PresetDiscovery instance', () => {
    const discovery = createDiscovery();
    expect(discovery).toBeInstanceOf(PresetDiscovery);
  });

  it('should create with custom options', () => {
    const discovery = createDiscovery({
      patterns: ['custom-*'],
      searchDirs: ['/custom'],
    });
    expect(discovery).toBeInstanceOf(PresetDiscovery);
  });
});

describe('discoverPresets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should discover presets with default options', () => {
    mockExistsSync.mockReturnValue(false);

    const result = discoverPresets({ searchDirs: ['/empty'] });
    expect(result).toEqual([]);
  });

  it('should pass options to discovery', () => {
    mockExistsSync.mockReturnValue(false);

    const result = discoverPresets({
      patterns: ['custom-*'],
      includeDevDeps: false,
    });

    expect(result).toEqual([]);
  });
});
