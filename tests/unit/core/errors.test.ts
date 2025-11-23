import { describe, it, expect } from 'vitest';
import {
  PrecommitError,
  ConfigValidationError,
  FolderRuleViolationError,
  CommitMessageFormatError,
  GitOperationError,
  FileSystemError,
  PresetNotFoundError
} from '../../../src/core/errors.js';

describe('errors', () => {
  describe('PrecommitError', () => {
    it('should create error with message', () => {
      const error = new PrecommitError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.name).toBe('PrecommitError');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof PrecommitError).toBe(true);
    });
  });

  describe('ConfigValidationError', () => {
    it('should create error with message only', () => {
      const error = new ConfigValidationError('Invalid config');

      expect(error.message).toBe('Invalid config');
      expect(error.name).toBe('ConfigValidationError');
      expect(error.field).toBeUndefined();
      expect(error.value).toBeUndefined();
    });

    it('should create error with field and value', () => {
      const error = new ConfigValidationError('Invalid depth', 'depth', 0);

      expect(error.message).toBe('Invalid depth');
      expect(error.name).toBe('ConfigValidationError');
      expect(error.field).toBe('depth');
      expect(error.value).toBe(0);
      expect(error instanceof PrecommitError).toBe(true);
    });
  });

  describe('FolderRuleViolationError', () => {
    it('should create error with folders and files', () => {
      const folders = ['src/core', 'src/hooks'];
      const files = ['src/core/config.ts', 'src/hooks/pre-commit.ts'];
      const error = new FolderRuleViolationError(
        'Files in different folders',
        folders,
        files
      );

      expect(error.message).toBe('Files in different folders');
      expect(error.name).toBe('FolderRuleViolationError');
      expect(error.folders).toEqual(folders);
      expect(error.files).toEqual(files);
      expect(error instanceof PrecommitError).toBe(true);
    });
  });

  describe('CommitMessageFormatError', () => {
    it('should create error with commit message', () => {
      const commitMessage = 'Invalid commit message';
      const error = new CommitMessageFormatError(
        'Missing prefix',
        commitMessage
      );

      expect(error.message).toBe('Missing prefix');
      expect(error.name).toBe('CommitMessageFormatError');
      expect(error.commitMessage).toBe(commitMessage);
      expect(error.expectedFormat).toBeUndefined();
      expect(error instanceof PrecommitError).toBe(true);
    });

    it('should create error with expected format', () => {
      const commitMessage = 'Add feature';
      const expectedFormat = '[prefix] description';
      const error = new CommitMessageFormatError(
        'Missing prefix',
        commitMessage,
        expectedFormat
      );

      expect(error.message).toBe('Missing prefix');
      expect(error.name).toBe('CommitMessageFormatError');
      expect(error.commitMessage).toBe(commitMessage);
      expect(error.expectedFormat).toBe(expectedFormat);
    });
  });

  describe('GitOperationError', () => {
    it('should create error with operation', () => {
      const error = new GitOperationError('Failed to get status', 'git status');

      expect(error.message).toBe('Failed to get status');
      expect(error.name).toBe('GitOperationError');
      expect(error.operation).toBe('git status');
      expect(error.exitCode).toBeUndefined();
      expect(error instanceof PrecommitError).toBe(true);
    });

    it('should create error with exit code', () => {
      const error = new GitOperationError(
        'Failed to commit',
        'git commit',
        1
      );

      expect(error.message).toBe('Failed to commit');
      expect(error.name).toBe('GitOperationError');
      expect(error.operation).toBe('git commit');
      expect(error.exitCode).toBe(1);
    });
  });

  describe('FileSystemError', () => {
    it('should create error with file path', () => {
      const error = new FileSystemError(
        'File not found',
        '/path/to/file.ts'
      );

      expect(error.message).toBe('File not found');
      expect(error.name).toBe('FileSystemError');
      expect(error.filePath).toBe('/path/to/file.ts');
      expect(error.originalError).toBeUndefined();
      expect(error instanceof PrecommitError).toBe(true);
    });

    it('should create error with original error', () => {
      const originalError = new Error('ENOENT');
      const error = new FileSystemError(
        'File not found',
        '/path/to/file.ts',
        originalError
      );

      expect(error.message).toBe('File not found');
      expect(error.name).toBe('FileSystemError');
      expect(error.filePath).toBe('/path/to/file.ts');
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('PresetNotFoundError', () => {
    it('should create error with preset name and available presets', () => {
      const availablePresets = ['folder-based', 'conventional-commits'];
      const error = new PresetNotFoundError('invalid-preset', availablePresets);

      expect(error.message).toContain('invalid-preset');
      expect(error.message).toContain('folder-based');
      expect(error.message).toContain('conventional-commits');
      expect(error.name).toBe('PresetNotFoundError');
      expect(error.presetName).toBe('invalid-preset');
      expect(error.availablePresets).toEqual(availablePresets);
      expect(error instanceof PrecommitError).toBe(true);
    });
  });
});
