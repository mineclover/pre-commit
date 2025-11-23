import { describe, it, expect, vi } from 'vitest';
import { getStagedFiles, getPathDepth, getMinDepth } from '../../../src/core/git-helper.js';

describe('git-helper', () => {
  describe('getPathDepth', () => {
    it('should return 0 for root files', () => {
      expect(getPathDepth('README.md')).toBe(0);
      expect(getPathDepth('package.json')).toBe(0);
    });

    it('should return correct depth for nested files', () => {
      expect(getPathDepth('src/file.ts')).toBe(1);
      expect(getPathDepth('src/core/config.ts')).toBe(2);
      expect(getPathDepth('src/core/utils/helpers.ts')).toBe(3);
    });
  });

  describe('getMinDepth', () => {
    it('should return 0 for empty array', () => {
      expect(getMinDepth([])).toBe(0);
    });

    it('should return minimum depth among files', () => {
      const files = ['src/file.ts', 'src/core/config.ts', 'src/core/utils/helpers.ts'];
      expect(getMinDepth(files)).toBe(1);
    });

    it('should return 0 when root files are present', () => {
      const files = ['README.md', 'src/core/config.ts'];
      expect(getMinDepth(files)).toBe(0);
    });

    it('should handle single file', () => {
      expect(getMinDepth(['src/core/file.ts'])).toBe(2);
    });
  });

  describe('getStagedFiles', () => {
    it('should return unique staged files', async () => {
      const mockGit = {
        status: vi.fn().mockResolvedValue({
          staged: ['src/file1.ts', 'src/file2.ts'],
          created: ['src/file3.ts'],
          renamed: [{ from: 'old.ts', to: 'new.ts' }]
        })
      };

      const files = await getStagedFiles(mockGit as any);

      expect(files).toContain('src/file1.ts');
      expect(files).toContain('src/file2.ts');
      expect(files).toContain('src/file3.ts');
      expect(files).toContain('new.ts');
      expect(files).not.toContain('old.ts');
    });

    it('should remove duplicates', async () => {
      const mockGit = {
        status: vi.fn().mockResolvedValue({
          staged: ['src/file1.ts', 'src/file1.ts'],
          created: ['src/file1.ts'],
          renamed: []
        })
      };

      const files = await getStagedFiles(mockGit as any);

      expect(files).toEqual(['src/file1.ts']);
    });

    it('should handle empty status', async () => {
      const mockGit = {
        status: vi.fn().mockResolvedValue({
          staged: [],
          created: [],
          renamed: []
        })
      };

      const files = await getStagedFiles(mockGit as any);

      expect(files).toEqual([]);
    });

    it('should handle only renamed files', async () => {
      const mockGit = {
        status: vi.fn().mockResolvedValue({
          staged: [],
          created: [],
          renamed: [
            { from: 'old1.ts', to: 'new1.ts' },
            { from: 'old2.ts', to: 'new2.ts' }
          ]
        })
      };

      const files = await getStagedFiles(mockGit as any);

      expect(files).toContain('new1.ts');
      expect(files).toContain('new2.ts');
      expect(files).not.toContain('old1.ts');
      expect(files).not.toContain('old2.ts');
    });
  });
});
