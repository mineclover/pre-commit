import { describe, it, expect } from 'vitest';
import { FolderBasedPreset } from '../../../src/presets/folder-based/preset.js';
import type { FolderBasedConfig } from '../../../src/presets/folder-based/types.js';

describe('FolderBasedPreset', () => {
  const preset = new FolderBasedPreset();

  const baseConfig: FolderBasedConfig = {
    preset: 'folder-based',
    depth: 2,
    logFile: '.commit-logs/test.log',
    enabled: true,
    ignorePaths: ['package.json', 'README.md']
  };

  describe('validateFiles', () => {
    it('should pass when all files are in the same folder', () => {
      const files = ['src/core/config.ts', 'src/core/types.ts'];
      const result = preset.validateFiles(files, baseConfig);

      expect(result.valid).toBe(true);
      expect(result.commonPath).toBe('src/core');
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when files are in different folders', () => {
      const files = ['src/core/config.ts', 'src/hooks/pre-commit.ts'];
      const result = preset.validateFiles(files, baseConfig);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should filter ignored files', () => {
      const files = ['src/core/config.ts', 'package.json'];
      const result = preset.validateFiles(files, baseConfig);

      expect(result.valid).toBe(true);
      expect(result.stats?.filteredFiles).toBe(1);
      expect(result.stats?.ignoredFiles).toBe(1);
    });

    it('should handle all ignored files', () => {
      const files = ['package.json', 'README.md'];
      const result = preset.validateFiles(files, baseConfig);

      expect(result.valid).toBe(true);
      expect(result.commonPath).toBe('');
      expect(result.warnings).toContain('All staged files are in ignore list');
    });

    it('should handle root files', () => {
      const files = ['.gitignore', 'LICENSE'];
      const config: FolderBasedConfig = { ...baseConfig, ignorePaths: [] };
      const result = preset.validateFiles(files, config);

      expect(result.valid).toBe(true);
      expect(result.commonPath).toBe('');
    });

    it('should respect maxFiles limit', () => {
      const files = Array.from({ length: 150 }, (_, i) => `src/file${i}.ts`);
      const config: FolderBasedConfig = { ...baseConfig, maxFiles: 100 };
      const result = preset.validateFiles(files, config);

      expect(result.warnings?.some(w => w.includes('limit'))).toBe(true);
    });

    it('should handle auto depth mode', () => {
      const files = ['src/core/config.ts', 'src/core/types.ts'];
      const config: FolderBasedConfig = {
        ...baseConfig,
        depth: 'auto',
        maxDepth: 5
      };
      const result = preset.validateFiles(files, config);

      expect(result.valid).toBe(true);
    });

    it('should handle depth overrides', () => {
      const files = ['src/hooks/pre-commit.ts', 'src/hooks/commit-msg.ts'];
      const config: FolderBasedConfig = {
        ...baseConfig,
        depth: 3,
        depthOverrides: {
          'src/hooks': 2
        }
      };
      const result = preset.validateFiles(files, config);

      expect(result.valid).toBe(true);
      expect(result.commonPath).toBe('src/hooks');
    });

    it('should handle empty file list', () => {
      const result = preset.validateFiles([], baseConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No files staged for commit');
    });

    it('should handle depth larger than actual path', () => {
      const files = ['src/file.ts'];
      const config: FolderBasedConfig = { ...baseConfig, depth: 5 };
      const result = preset.validateFiles(files, config);

      expect(result.valid).toBe(true);
      expect(result.commonPath).toBe('src');
    });
  });

  describe('validateCommitMessage', () => {
    it('should pass valid commit message with prefix', () => {
      const message = '[src/core] Add new feature';
      const result = preset.validateCommitMessage(message, baseConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail on missing prefix', () => {
      const message = 'Add new feature';
      const result = preset.validateCommitMessage(message, baseConfig);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('prefix'))).toBe(true);
    });

    it('should fail on empty prefix', () => {
      const message = '[] Add new feature';
      const result = preset.validateCommitMessage(message, baseConfig);

      expect(result.valid).toBe(false);
    });

    it('should fail on missing description', () => {
      const message = '[src/core]';
      const result = preset.validateCommitMessage(message, baseConfig);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('description'))).toBe(true);
    });

    it('should fail on too short description', () => {
      const message = '[src/core] ab';
      const result = preset.validateCommitMessage(message, baseConfig);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('short'))).toBe(true);
    });

    it('should pass with [root] prefix', () => {
      const message = '[root] Update configuration';
      const result = preset.validateCommitMessage(message, baseConfig);

      expect(result.valid).toBe(true);
    });

    it('should pass with [config] prefix', () => {
      const message = '[config] Update settings';
      const result = preset.validateCommitMessage(message, baseConfig);

      expect(result.valid).toBe(true);
    });

    it('should handle multi-line commit messages', () => {
      const message = '[src/core] Add new feature\n\nDetailed explanation here';
      const result = preset.validateCommitMessage(message, baseConfig);

      expect(result.valid).toBe(true);
    });

    it('should fail on empty message', () => {
      const message = '';
      const result = preset.validateCommitMessage(message, baseConfig);

      expect(result.valid).toBe(false);
    });
  });

  describe('getCommitPrefix', () => {
    it('should return formatted prefix from validation result', () => {
      const validationResult = {
        valid: true,
        commonPath: 'src/core',
        files: ['src/core/config.ts'],
        errors: [],
        warnings: [],
        stats: {
          totalFiles: 1,
          filteredFiles: 1,
          ignoredFiles: 0,
          uniqueFolders: 1
        }
      };

      const prefix = preset.getCommitPrefix(validationResult, baseConfig);

      expect(prefix).toBe('[src/core]');
    });

    it('should return [root] for empty common path', () => {
      const validationResult = {
        valid: true,
        commonPath: '',
        files: ['README.md'],
        errors: [],
        warnings: [],
        stats: {
          totalFiles: 1,
          filteredFiles: 1,
          ignoredFiles: 0,
          uniqueFolders: 1
        }
      };

      const prefix = preset.getCommitPrefix(validationResult, baseConfig);

      expect(prefix).toBe('[root]');
    });

    it('should return [config] for ignored files only', () => {
      const validationResult = {
        valid: true,
        commonPath: '',
        files: ['package.json'],
        errors: [],
        warnings: ['All staged files are in ignore list'],
        stats: {
          totalFiles: 1,
          filteredFiles: 0,
          ignoredFiles: 1,
          uniqueFolders: 0
        }
      };

      const prefix = preset.getCommitPrefix(validationResult, baseConfig);

      expect(prefix).toBe('[config]');
    });
  });

  describe('edge cases', () => {
    it('should handle single file', () => {
      const files = ['src/core/config.ts'];
      const result = preset.validateFiles(files, baseConfig);

      expect(result.valid).toBe(true);
      expect(result.commonPath).toBe('src/core');
    });

    it('should handle nested paths correctly', () => {
      const files = [
        'src/core/utils/path-utils.ts',
        'src/core/utils/validation-utils.ts'
      ];
      const config: FolderBasedConfig = { ...baseConfig, depth: 3 };
      const result = preset.validateFiles(files, config);

      expect(result.valid).toBe(true);
      expect(result.commonPath).toBe('src/core/utils');
    });

    it('should handle files with same prefix but different depths', () => {
      const files = ['src/index.ts', 'src/core/config.ts'];
      const result = preset.validateFiles(files, baseConfig);

      expect(result.valid).toBe(false);
    });
  });
});
