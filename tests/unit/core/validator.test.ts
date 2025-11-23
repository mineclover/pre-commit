import { describe, it, expect } from 'vitest';
import { CommitValidator } from '../../../src/core/validator.js';
import type { FolderBasedConfig } from '../../../src/presets/folder-based/types.js';

describe('CommitValidator', () => {
  const baseConfig: FolderBasedConfig = {
    preset: 'folder-based',
    depth: 2,
    logFile: '.commit-logs/test.log',
    enabled: true,
    ignorePaths: ['package.json']
  };

  describe('constructor', () => {
    it('should create validator with folder-based preset', () => {
      const validator = new CommitValidator(baseConfig);

      expect(validator.getPresetName()).toBe('folder-based');
    });

    it('should throw error for unknown preset', () => {
      const invalidConfig = {
        preset: 'unknown-preset',
        logFile: '.commit-logs/test.log',
        enabled: true
      } as any;

      expect(() => new CommitValidator(invalidConfig)).toThrow();
    });
  });

  describe('validate', () => {
    it('should validate files in same folder', () => {
      const validator = new CommitValidator(baseConfig);
      const files = ['src/core/config.ts', 'src/core/types.ts'];

      const result = validator.validate(files);

      expect(result.valid).toBe(true);
      expect(result.commonPath).toBe('src/core');
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when files are in different folders', () => {
      const validator = new CommitValidator(baseConfig);
      const files = ['src/core/config.ts', 'src/hooks/pre-commit.ts'];

      const result = validator.validate(files);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should filter ignored files', () => {
      const validator = new CommitValidator(baseConfig);
      const files = ['src/core/config.ts', 'package.json'];

      const result = validator.validate(files);

      expect(result.valid).toBe(true);
      expect(result.stats?.filteredFiles).toBe(1);
      expect(result.stats?.ignoredFiles).toBe(1);
    });

    it('should handle empty file list', () => {
      const validator = new CommitValidator(baseConfig);

      const result = validator.validate([]);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No files staged for commit');
    });
  });

  describe('validateCommitMessage', () => {
    it('should validate correct commit message format', () => {
      const validator = new CommitValidator(baseConfig);
      const message = '[src/core] Add new feature';

      const result = validator.validateCommitMessage(message);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail on missing prefix', () => {
      const validator = new CommitValidator(baseConfig);
      const message = 'Add new feature';

      const result = validator.validateCommitMessage(message);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('prefix'))).toBe(true);
    });

    it('should fail on empty message', () => {
      const validator = new CommitValidator(baseConfig);

      const result = validator.validateCommitMessage('');

      expect(result.valid).toBe(false);
    });

    it('should validate [root] prefix', () => {
      const validator = new CommitValidator(baseConfig);
      const message = '[root] Update configuration';

      const result = validator.validateCommitMessage(message);

      expect(result.valid).toBe(true);
    });

    it('should validate [config] prefix', () => {
      const validator = new CommitValidator(baseConfig);
      const message = '[config] Update settings';

      const result = validator.validateCommitMessage(message);

      expect(result.valid).toBe(true);
    });
  });

  describe('getCommitPrefix', () => {
    it('should generate prefix from validation result', () => {
      const validator = new CommitValidator(baseConfig);
      const files = ['src/core/config.ts', 'src/core/types.ts'];
      const result = validator.validate(files);

      const prefix = validator.getCommitPrefix(result);

      expect(prefix).toBe('[src/core]');
    });

    it('should return [root] for empty common path', () => {
      const validator = new CommitValidator(baseConfig);
      const result = {
        valid: true,
        commonPath: '',
        files: ['README.md'],
        errors: [],
        stats: {
          totalFiles: 1,
          filteredFiles: 1,
          ignoredFiles: 0,
          uniqueFolders: 1
        }
      };

      const prefix = validator.getCommitPrefix(result);

      expect(prefix).toBe('[root]');
    });

    it('should return [config] for all ignored files', () => {
      const validator = new CommitValidator(baseConfig);
      const result = {
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

      const prefix = validator.getCommitPrefix(result);

      expect(prefix).toBe('[config]');
    });

    it('should support old signature (commonPath string)', () => {
      const validator = new CommitValidator(baseConfig);

      const prefix = validator.getCommitPrefix('src/core', false);

      expect(prefix).toBe('[src/core]');
    });

    it('should support old signature with empty path', () => {
      const validator = new CommitValidator(baseConfig);

      const prefix = validator.getCommitPrefix('', false);

      expect(prefix).toBe('[root]');
    });

    it('should support old signature with all files ignored', () => {
      const validator = new CommitValidator(baseConfig);

      const prefix = validator.getCommitPrefix('', true);

      expect(prefix).toBe('[config]');
    });
  });

  describe('getPresetName', () => {
    it('should return preset name', () => {
      const validator = new CommitValidator(baseConfig);

      expect(validator.getPresetName()).toBe('folder-based');
    });
  });

  describe('getPresetDescription', () => {
    it('should return preset description', () => {
      const validator = new CommitValidator(baseConfig);
      const description = validator.getPresetDescription();

      expect(description).toBeTruthy();
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });
  });
});
