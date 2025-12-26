import { describe, it, expect } from 'vitest';
import {
  getPathPrefix,
  filterIgnoredFiles,
  findLongestMatchingPrefix,
  isRootFile,
  normalizePath,
  getPathDepth,
  shouldIgnoreFile,
  hasPathTraversal,
  sanitizePath,
  filterInvalidPaths,
  validatePaths,
} from '../../../src/core/utils/path-utils.js';

describe('path-utils', () => {
  describe('getPathPrefix', () => {
    it('should extract correct prefix for given depth', () => {
      expect(getPathPrefix('src/components/Button/index.ts', 2)).toBe('src/components');
      expect(getPathPrefix('src/components/Button/index.ts', 3)).toBe('src/components/Button');
      expect(getPathPrefix('src/file.ts', 2)).toBe('src');
    });

    it('should handle depth larger than file path', () => {
      expect(getPathPrefix('README.md', 2)).toBe('');
      expect(getPathPrefix('src/file.ts', 5)).toBe('src');
    });

    it('should handle root files', () => {
      expect(getPathPrefix('README.md', 1)).toBe('');
      expect(getPathPrefix('package.json', 3)).toBe('');
    });

    it('should handle depth 1', () => {
      expect(getPathPrefix('src/components/Button.tsx', 1)).toBe('src');
      expect(getPathPrefix('lib/utils.ts', 1)).toBe('lib');
    });
  });

  describe('filterIgnoredFiles', () => {
    it('should filter out ignored files', () => {
      const files = ['src/index.ts', 'package.json', 'README.md', 'src/utils.ts'];
      const ignorePaths = ['package.json', 'README.md'];
      const result = filterIgnoredFiles(files, ignorePaths);

      expect(result).toEqual(['src/index.ts', 'src/utils.ts']);
    });

    it('should handle empty ignore list', () => {
      const files = ['src/index.ts', 'package.json'];
      const result = filterIgnoredFiles(files, []);

      expect(result).toEqual(files);
    });

    it('should handle wildcards in ignore paths', () => {
      const files = ['src/index.ts', 'dist/main.js', 'dist/utils.js', 'tests/test.ts'];
      const ignorePaths = ['dist'];
      const result = filterIgnoredFiles(files, ignorePaths);

      expect(result).toEqual(['src/index.ts', 'tests/test.ts']);
    });

    it('should return empty array when all files are ignored', () => {
      const files = ['package.json', 'README.md'];
      const ignorePaths = ['package.json', 'README.md'];
      const result = filterIgnoredFiles(files, ignorePaths);

      expect(result).toEqual([]);
    });
  });

  describe('findLongestMatchingPrefix', () => {
    it('should find longest matching prefix', () => {
      const filePath = 'src/hooks/pre-commit.ts';
      const prefixes = ['src', 'src/hooks', 'src/core'];
      const result = findLongestMatchingPrefix(filePath, prefixes);

      expect(result).toBe('src/hooks');
    });

    it('should return null when no match found', () => {
      const filePath = 'lib/utils.ts';
      const prefixes = ['src', 'tests'];
      const result = findLongestMatchingPrefix(filePath, prefixes);

      expect(result).toBeNull();
    });

    it('should handle single prefix', () => {
      const filePath = 'src/core/config.ts';
      const prefixes = ['src'];
      const result = findLongestMatchingPrefix(filePath, prefixes);

      expect(result).toBe('src');
    });

    it('should handle empty prefix list', () => {
      const result = findLongestMatchingPrefix('src/file.ts', []);
      expect(result).toBeNull();
    });
  });

  describe('isRootFile', () => {
    it('should identify root files', () => {
      expect(isRootFile('README.md')).toBe(true);
      expect(isRootFile('package.json')).toBe(true);
      expect(isRootFile('.gitignore')).toBe(true);
    });

    it('should identify non-root files', () => {
      expect(isRootFile('src/index.ts')).toBe(false);
      expect(isRootFile('lib/utils.ts')).toBe(false);
    });
  });

  describe('normalizePath', () => {
    it('should normalize Windows paths to Unix', () => {
      expect(normalizePath('src\\components\\Button.ts')).toBe('src/components/Button.ts');
      expect(normalizePath('C:\\Users\\file.ts')).toBe('C:/Users/file.ts');
    });

    it('should leave Unix paths unchanged', () => {
      expect(normalizePath('src/components/Button.ts')).toBe('src/components/Button.ts');
    });
  });

  describe('getPathDepth', () => {
    it('should calculate path depth correctly', () => {
      expect(getPathDepth('src/components/Button.tsx')).toBe(2);
      expect(getPathDepth('dist/bundle.js')).toBe(1);
      expect(getPathDepth('README.md')).toBe(0);
      expect(getPathDepth('a/b/c/d/e/file.ts')).toBe(5);
    });
  });

  describe('shouldIgnoreFile', () => {
    it('should match exact ignore paths', () => {
      expect(shouldIgnoreFile('package.json', ['package.json'])).toBe(true);
      expect(shouldIgnoreFile('README.md', ['README.md'])).toBe(true);
    });

    it('should match descendant paths', () => {
      expect(shouldIgnoreFile('dist/bundle.js', ['dist'])).toBe(true);
      expect(shouldIgnoreFile('node_modules/lib/index.js', ['node_modules'])).toBe(true);
    });

    it('should not match unrelated paths', () => {
      expect(shouldIgnoreFile('src/index.ts', ['dist'])).toBe(false);
      expect(shouldIgnoreFile('distribution/file.js', ['dist'])).toBe(false);
    });
  });

  describe('hasPathTraversal', () => {
    it('should detect path traversal with ../', () => {
      expect(hasPathTraversal('../etc/passwd')).toBe(true);
      expect(hasPathTraversal('../../secret')).toBe(true);
    });

    it('should detect path traversal in middle of path', () => {
      expect(hasPathTraversal('src/../config.ts')).toBe(true);
      expect(hasPathTraversal('a/b/../c/d')).toBe(true);
    });

    it('should not flag valid paths', () => {
      expect(hasPathTraversal('src/components/file.ts')).toBe(false);
      expect(hasPathTraversal('file.ts')).toBe(false);
      expect(hasPathTraversal('./file.ts')).toBe(false);
    });

    it('should not flag triple dots', () => {
      expect(hasPathTraversal('...')).toBe(false);
      expect(hasPathTraversal('src/.../file.ts')).toBe(false);
    });

    it('should handle Windows paths', () => {
      expect(hasPathTraversal('..\\etc\\passwd')).toBe(true);
      expect(hasPathTraversal('src\\..\\config.ts')).toBe(true);
    });
  });

  describe('sanitizePath', () => {
    it('should return unchanged valid paths', () => {
      expect(sanitizePath('src/components/file.ts')).toBe('src/components/file.ts');
      expect(sanitizePath('file.ts')).toBe('file.ts');
    });

    it('should resolve internal .. segments', () => {
      expect(sanitizePath('src/../core/file.ts')).toBe('core/file.ts');
      expect(sanitizePath('a/b/../c/d')).toBe('a/c/d');
    });

    it('should return null for paths escaping root', () => {
      expect(sanitizePath('../etc/passwd')).toBeNull();
      expect(sanitizePath('src/../../etc')).toBeNull();
    });

    it('should handle . segments', () => {
      expect(sanitizePath('./src/file.ts')).toBe('src/file.ts');
      expect(sanitizePath('src/./file.ts')).toBe('src/file.ts');
    });

    it('should handle empty paths', () => {
      expect(sanitizePath('')).toBe('');
    });
  });

  describe('filterInvalidPaths', () => {
    it('should remove paths with traversal patterns', () => {
      const files = ['src/file.ts', '../etc/passwd', 'valid.ts'];
      expect(filterInvalidPaths(files)).toEqual(['src/file.ts', 'valid.ts']);
    });

    it('should return all files if none are invalid', () => {
      const files = ['src/file.ts', 'lib/util.ts'];
      expect(filterInvalidPaths(files)).toEqual(files);
    });

    it('should return empty array if all are invalid', () => {
      const files = ['../a', '../../b'];
      expect(filterInvalidPaths(files)).toEqual([]);
    });
  });

  describe('validatePaths', () => {
    it('should separate valid and invalid paths', () => {
      const result = validatePaths(['src/file.ts', '../etc/passwd', 'valid.ts']);
      expect(result.valid).toEqual(['src/file.ts', 'valid.ts']);
      expect(result.rejected).toEqual(['../etc/passwd']);
    });

    it('should handle all valid paths', () => {
      const result = validatePaths(['src/a.ts', 'lib/b.ts']);
      expect(result.valid).toEqual(['src/a.ts', 'lib/b.ts']);
      expect(result.rejected).toEqual([]);
    });

    it('should handle all invalid paths', () => {
      const result = validatePaths(['../a', '../../b']);
      expect(result.valid).toEqual([]);
      expect(result.rejected).toEqual(['../a', '../../b']);
    });

    it('should handle empty input', () => {
      const result = validatePaths([]);
      expect(result.valid).toEqual([]);
      expect(result.rejected).toEqual([]);
    });
  });
});
