import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigLoader, createConfigLoader, loadExtendedConfig } from '../../../../src/core/config/loader.js';
import { ConfigValidationError } from '../../../../src/core/errors.js';

// Mock fs module
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

import { existsSync, readFileSync } from 'fs';

const mockExistsSync = existsSync as ReturnType<typeof vi.fn>;
const mockReadFileSync = readFileSync as ReturnType<typeof vi.fn>;

describe('ConfigLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('findConfigFile', () => {
    it('should find .precommitrc.json', () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.json')
      );

      const loader = new ConfigLoader({ cwd: '/project' });
      const result = loader.findConfigFile();

      expect(result).not.toBeNull();
      expect(result?.format).toBe('json');
      expect(result?.path).toContain('.precommitrc.json');
    });

    it('should find .precommitrc.js when json not found', () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.js')
      );

      const loader = new ConfigLoader({ cwd: '/project' });
      const result = loader.findConfigFile();

      expect(result).not.toBeNull();
      expect(result?.format).toBe('js');
    });

    it('should find .precommitrc.ts when js not found', () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.ts')
      );

      const loader = new ConfigLoader({ cwd: '/project' });
      const result = loader.findConfigFile();

      expect(result).not.toBeNull();
      expect(result?.format).toBe('ts');
    });

    it('should find config in package.json', () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('package.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        name: 'test-package',
        precommit: { preset: 'folder-based' }
      }));

      const loader = new ConfigLoader({ cwd: '/project' });
      const result = loader.findConfigFile();

      expect(result).not.toBeNull();
      expect(result?.format).toBe('package');
      expect(result?.isPackageJson).toBe(true);
    });

    it('should return null when no config found', () => {
      mockExistsSync.mockReturnValue(false);

      const loader = new ConfigLoader({ cwd: '/project' });
      const result = loader.findConfigFile();

      expect(result).toBeNull();
    });

    it('should ignore package.json without precommit field', () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('package.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        name: 'test-package'
      }));

      const loader = new ConfigLoader({ cwd: '/project' });
      const result = loader.findConfigFile();

      expect(result).toBeNull();
    });
  });

  describe('load', () => {
    it('should return default config when no config file exists', async () => {
      mockExistsSync.mockReturnValue(false);

      const loader = new ConfigLoader({ cwd: '/project' });
      const config = await loader.load();

      expect(config.preset).toBe('folder-based');
      expect(config.enabled).toBe(true);
      expect(config._sources).toEqual([]);
    });

    it('should load JSON config file', async () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        preset: 'folder-based',
        depth: 3,
        enabled: true
      }));

      const loader = new ConfigLoader({ cwd: '/project' });
      const config = await loader.load();

      expect(config.preset).toBe('folder-based');
      expect(config.depth).toBe(3);
      expect(config.enabled).toBe(true);
    });

    it('should load config from package.json precommit field', async () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('package.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        name: 'test-package',
        precommit: {
          preset: 'folder-based',
          maxFiles: 50
        }
      }));

      const loader = new ConfigLoader({ cwd: '/project' });
      const config = await loader.load();

      expect(config.preset).toBe('folder-based');
      expect(config.maxFiles).toBe(50);
    });

    it('should use cache for repeated loads', async () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        preset: 'folder-based'
      }));

      const loader = new ConfigLoader({ cwd: '/project' });
      await loader.load();
      await loader.load();

      // readFileSync should only be called once due to caching
      expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('extends', () => {
    it('should load preset:recommended', async () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        extends: 'preset:recommended'
      }));

      const loader = new ConfigLoader({ cwd: '/project' });
      const config = await loader.load();

      expect(config.preset).toBe('folder-based');
      expect(config._sources).toContain('preset:recommended');
    });

    it('should load preset:strict', async () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        extends: 'preset:strict'
      }));

      const loader = new ConfigLoader({ cwd: '/project' });
      const config = await loader.load();

      expect(config.preset).toBe('folder-based');
    });

    it('should load preset:relaxed', async () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        extends: 'preset:relaxed'
      }));

      const loader = new ConfigLoader({ cwd: '/project' });
      const config = await loader.load();

      expect(config.preset).toBe('folder-based');
    });

    it('should throw for unknown preset', async () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        extends: 'preset:unknown'
      }));

      const loader = new ConfigLoader({ cwd: '/project' });

      await expect(loader.load()).rejects.toThrow(ConfigValidationError);
    });

    it('should support array of extends', async () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        extends: ['preset:recommended'],
        depth: 5
      }));

      const loader = new ConfigLoader({ cwd: '/project' });
      const config = await loader.load();

      expect(config.depth).toBe(5);
    });

    it('should merge child config over parent', async () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        extends: 'preset:recommended',
        depth: 10
      }));

      const loader = new ConfigLoader({ cwd: '/project' });
      const config = await loader.load();

      // Child's depth should override parent's
      expect(config.depth).toBe(10);
    });
  });

  describe('environment interpolation', () => {
    it('should interpolate env variables', async () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        preset: 'folder-based',
        logFile: '${LOG_DIR}/violations.log'
      }));

      const loader = new ConfigLoader({
        cwd: '/project',
        env: { LOG_DIR: '/var/log' }
      });
      const config = await loader.load();

      expect(config.logFile).toBe('/var/log/violations.log');
    });

    it('should use $env defaults', async () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        preset: 'folder-based',
        $env: { LOG_DIR: '/default/log' },
        logFile: '${LOG_DIR}/violations.log'
      }));

      const loader = new ConfigLoader({ cwd: '/project' });
      const config = await loader.load();

      expect(config.logFile).toBe('/default/log/violations.log');
    });

    it('should override $env defaults with actual env', async () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        preset: 'folder-based',
        $env: { LOG_DIR: '/default/log' },
        logFile: '${LOG_DIR}/violations.log'
      }));

      const loader = new ConfigLoader({
        cwd: '/project',
        env: { LOG_DIR: '/custom/log' }
      });
      const config = await loader.load();

      expect(config.logFile).toBe('/custom/log/violations.log');
    });
  });

  describe('conditionals', () => {
    it('should apply conditional based on branch', async () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        preset: 'folder-based',
        depth: 3,
        conditionals: [{
          when: { branch: 'main' },
          config: { depth: 2 }
        }]
      }));

      const loader = new ConfigLoader({
        cwd: '/project',
        branch: 'main'
      });
      const config = await loader.load();

      expect(config.depth).toBe(2);
    });

    it('should not apply conditional when branch does not match', async () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        preset: 'folder-based',
        depth: 3,
        conditionals: [{
          when: { branch: 'main' },
          config: { depth: 2 }
        }]
      }));

      const loader = new ConfigLoader({
        cwd: '/project',
        branch: 'feature/test'
      });
      const config = await loader.load();

      expect(config.depth).toBe(3);
    });

    it('should apply conditional based on env', async () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        preset: 'folder-based',
        depth: 3,
        conditionals: [{
          when: { env: { CI: 'true' } },
          config: { depth: 1 }
        }]
      }));

      const loader = new ConfigLoader({
        cwd: '/project',
        env: { CI: 'true' }
      });
      const config = await loader.load();

      expect(config.depth).toBe(1);
    });

    it('should apply conditional based on file patterns', async () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        preset: 'folder-based',
        depth: 3,
        conditionals: [{
          when: { files: ['*.md'] },
          config: { depth: 5 }
        }]
      }));

      const loader = new ConfigLoader({
        cwd: '/project',
        stagedFiles: ['README.md']
      });
      const config = await loader.load();

      expect(config.depth).toBe(5);
    });

    it('should support wildcard branch patterns', async () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        preset: 'folder-based',
        depth: 3,
        conditionals: [{
          when: { branch: 'feature/*' },
          config: { depth: 4 }
        }]
      }));

      const loader = new ConfigLoader({
        cwd: '/project',
        branch: 'feature/new-thing'
      });
      const config = await loader.load();

      expect(config.depth).toBe(4);
    });
  });

  describe('deep merge', () => {
    it('should merge nested objects', async () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        extends: 'preset:recommended',
        presets: {
          'folder-based': {
            depth: 10
          }
        }
      }));

      const loader = new ConfigLoader({ cwd: '/project' });
      const config = await loader.load();

      // Should have merged nested presets object
      expect(config.presets).toBeDefined();
    });

    it('should concatenate arrays', async () => {
      mockExistsSync.mockImplementation((path: string) =>
        path.endsWith('.precommitrc.json')
      );
      mockReadFileSync.mockReturnValue(JSON.stringify({
        extends: 'preset:recommended',
        ignorePaths: ['custom.txt']
      }));

      const loader = new ConfigLoader({ cwd: '/project' });
      const config = await loader.load();

      // Should have concatenated ignorePaths
      expect(config.ignorePaths).toContain('custom.txt');
    });
  });
});

describe('createConfigLoader', () => {
  it('should create a ConfigLoader instance', () => {
    const loader = createConfigLoader({ cwd: '/test' });
    expect(loader).toBeInstanceOf(ConfigLoader);
  });
});

describe('loadExtendedConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load config with default options', async () => {
    mockExistsSync.mockReturnValue(false);

    const config = await loadExtendedConfig();

    expect(config.preset).toBe('folder-based');
  });
});
