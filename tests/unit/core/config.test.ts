import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../../../src/core/config.js';
import { ConfigValidationError } from '../../../src/core/errors.js';
import { existsSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

describe('config', () => {
  const TEST_DIR = join(process.cwd(), 'tests', 'temp-config');
  const ORIGINAL_CWD = process.cwd();

  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
    process.chdir(TEST_DIR);
  });

  afterEach(() => {
    process.chdir(ORIGINAL_CWD);
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('loadConfig', () => {
    it('should return default config when .precommitrc.json does not exist', () => {
      const config = loadConfig();

      expect(config.preset).toBe('folder-based');
      expect(config.enabled).toBe(true);
      expect(config.ignorePaths).toEqual([]);
    });

    it('should load valid folder-based config from file', () => {
      const testConfig = {
        preset: 'folder-based',
        depth: 2,
        logFile: '.commit-logs/test.log',
        enabled: true,
        ignorePaths: ['package.json', 'README.md']
      };

      writeFileSync('.precommitrc.json', JSON.stringify(testConfig, null, 2));

      const config = loadConfig();

      expect(config.preset).toBe('folder-based');
      expect(config.depth).toBe(2);
      expect(config.ignorePaths).toEqual(['package.json', 'README.md']);
    });

    it('should default to folder-based preset when preset is not specified', () => {
      const testConfig = {
        depth: 3,
        enabled: true
      };

      writeFileSync('.precommitrc.json', JSON.stringify(testConfig, null, 2));

      const config = loadConfig();

      expect(config.preset).toBe('folder-based');
      expect(config.depth).toBe(3);
    });

    it('should merge user config with defaults', () => {
      const testConfig = {
        preset: 'folder-based',
        depth: 4
      };

      writeFileSync('.precommitrc.json', JSON.stringify(testConfig, null, 2));

      const config = loadConfig();

      expect(config.preset).toBe('folder-based');
      expect(config.depth).toBe(4);
      expect(config.enabled).toBe(true); // default value
    });

    it('should throw on invalid JSON', () => {
      writeFileSync('.precommitrc.json', '{ invalid json }');

      expect(() => loadConfig()).toThrow(SyntaxError);
    });

    it('should throw ConfigValidationError on invalid preset', () => {
      const testConfig = {
        preset: 'invalid-preset',
        depth: 2
      };

      writeFileSync('.precommitrc.json', JSON.stringify(testConfig, null, 2));

      expect(() => loadConfig()).toThrow(ConfigValidationError);
      expect(() => loadConfig()).toThrow(/Invalid preset/);
    });

    it('should throw ConfigValidationError on invalid depth', () => {
      const testConfig = {
        preset: 'folder-based',
        depth: 0
      };

      writeFileSync('.precommitrc.json', JSON.stringify(testConfig, null, 2));

      expect(() => loadConfig()).toThrow(ConfigValidationError);
    });

    it('should throw ConfigValidationError on depth out of range', () => {
      const testConfig = {
        preset: 'folder-based',
        depth: 15
      };

      writeFileSync('.precommitrc.json', JSON.stringify(testConfig, null, 2));

      expect(() => loadConfig()).toThrow(ConfigValidationError);
    });

    it('should accept auto depth', () => {
      const testConfig = {
        preset: 'folder-based',
        depth: 'auto',
        maxDepth: 5
      };

      writeFileSync('.precommitrc.json', JSON.stringify(testConfig, null, 2));

      const config = loadConfig();

      expect(config.depth).toBe('auto');
      expect(config.maxDepth).toBe(5);
    });

    it('should throw ConfigValidationError on invalid maxDepth', () => {
      const testConfig = {
        preset: 'folder-based',
        depth: 'auto',
        maxDepth: 0
      };

      writeFileSync('.precommitrc.json', JSON.stringify(testConfig, null, 2));

      expect(() => loadConfig()).toThrow(ConfigValidationError);
    });

    it('should accept valid depthOverrides', () => {
      const testConfig = {
        preset: 'folder-based',
        depth: 3,
        depthOverrides: {
          'src/hooks': 2,
          'src/core': 2
        }
      };

      writeFileSync('.precommitrc.json', JSON.stringify(testConfig, null, 2));

      const config = loadConfig();

      expect(config.depthOverrides).toEqual({
        'src/hooks': 2,
        'src/core': 2
      });
    });

    it('should throw ConfigValidationError on invalid depthOverrides', () => {
      const testConfig = {
        preset: 'folder-based',
        depth: 3,
        depthOverrides: {
          'src/hooks': 0
        }
      };

      writeFileSync('.precommitrc.json', JSON.stringify(testConfig, null, 2));

      expect(() => loadConfig()).toThrow(ConfigValidationError);
    });

    it('should throw ConfigValidationError on invalid maxFiles', () => {
      const testConfig = {
        preset: 'folder-based',
        depth: 2,
        maxFiles: 0
      };

      writeFileSync('.precommitrc.json', JSON.stringify(testConfig, null, 2));

      expect(() => loadConfig()).toThrow(ConfigValidationError);
    });

    it('should throw ConfigValidationError on invalid ignorePaths', () => {
      const testConfig = {
        preset: 'folder-based',
        depth: 2,
        ignorePaths: 'not-an-array'
      };

      writeFileSync('.precommitrc.json', JSON.stringify(testConfig, null, 2));

      expect(() => loadConfig()).toThrow(ConfigValidationError);
    });

    it('should accept conventional-commits preset', () => {
      const testConfig = {
        preset: 'conventional-commits',
        logFile: '.commit-logs/violations.log',
        enabled: true
      };

      writeFileSync('.precommitrc.json', JSON.stringify(testConfig, null, 2));

      const config = loadConfig();

      expect(config.preset).toBe('conventional-commits');
      expect(config.enabled).toBe(true);
    });
  });
});
