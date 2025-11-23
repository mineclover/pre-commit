import { describe, it, expect } from 'vitest';
import {
  validateDepth,
  validateMaxFiles,
  validatePathArray,
  validateDepthOverrides,
  isInRange,
  parseCommitMessagePrefix
} from '../../../src/core/utils/validation-utils.js';

describe('validation-utils', () => {
  describe('validateDepth', () => {
    it('should accept valid depth numbers', () => {
      expect(() => validateDepth(1)).not.toThrow();
      expect(() => validateDepth(5)).not.toThrow();
      expect(() => validateDepth(10)).not.toThrow();
    });

    it('should accept "auto" as valid depth', () => {
      expect(() => validateDepth('auto')).not.toThrow();
    });

    it('should throw on depth < 1', () => {
      expect(() => validateDepth(0)).toThrow();
      expect(() => validateDepth(-1)).toThrow();
    });

    it('should throw on depth > 10', () => {
      expect(() => validateDepth(11)).toThrow();
      expect(() => validateDepth(100)).toThrow();
    });

    it('should throw on non-integer depth', () => {
      expect(() => validateDepth(2.5)).toThrow();
      expect(() => validateDepth(3.14)).toThrow();
    });

    it('should throw on invalid types', () => {
      expect(() => validateDepth('invalid' as any)).toThrow();
      expect(() => validateDepth(null as any)).toThrow();
      expect(() => validateDepth(undefined as any)).toThrow();
    });

    it('should use custom field name in error message', () => {
      try {
        validateDepth(0, 'customDepth');
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('customDepth');
      }
    });
  });

  describe('validateMaxFiles', () => {
    it('should accept valid maxFiles values', () => {
      expect(() => validateMaxFiles(1)).not.toThrow();
      expect(() => validateMaxFiles(100)).not.toThrow();
      expect(() => validateMaxFiles(1000)).not.toThrow();
    });

    it('should accept undefined', () => {
      expect(() => validateMaxFiles(undefined)).not.toThrow();
    });

    it('should throw on maxFiles < 1', () => {
      expect(() => validateMaxFiles(0)).toThrow();
      expect(() => validateMaxFiles(-5)).toThrow();
    });

    it('should throw on maxFiles > 1000', () => {
      expect(() => validateMaxFiles(1001)).toThrow();
      expect(() => validateMaxFiles(5000)).toThrow();
    });

    it('should throw on non-integer values', () => {
      expect(() => validateMaxFiles(50.5)).toThrow();
    });
  });

  describe('validatePathArray', () => {
    it('should accept valid string arrays', () => {
      expect(() => validatePathArray(['src', 'lib'])).not.toThrow();
      expect(() => validatePathArray([])).not.toThrow();
    });

    it('should throw on non-array values', () => {
      expect(() => validatePathArray('not-an-array' as any)).toThrow();
      expect(() => validatePathArray(null as any)).toThrow();
      expect(() => validatePathArray(undefined as any)).toThrow();
      expect(() => validatePathArray(123 as any)).toThrow();
    });

    it('should throw on arrays with non-string elements', () => {
      expect(() => validatePathArray([1, 2, 3] as any)).toThrow();
      expect(() => validatePathArray(['valid', 123] as any)).toThrow();
      expect(() => validatePathArray([null] as any)).toThrow();
    });

    it('should use custom field name in error message', () => {
      try {
        validatePathArray('invalid' as any, 'customField');
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('customField');
      }
    });

    it('should narrow type correctly', () => {
      const value: unknown = ['src', 'lib'];
      validatePathArray(value);
      // TypeScript should now know value is string[]
      const firstElement: string = value[0];
      expect(firstElement).toBe('src');
    });
  });

  describe('validateDepthOverrides', () => {
    it('should accept valid overrides', () => {
      expect(() => validateDepthOverrides({ 'src/hooks': 2, 'src/core': 3 })).not.toThrow();
      expect(() => validateDepthOverrides({})).not.toThrow();
      expect(() => validateDepthOverrides(undefined)).not.toThrow();
    });

    it('should throw on invalid override values', () => {
      expect(() => validateDepthOverrides({ 'src': 0 })).toThrow();
      expect(() => validateDepthOverrides({ 'src': 11 })).toThrow();
      expect(() => validateDepthOverrides({ 'src': 2.5 })).toThrow();
    });

    it('should throw on empty path keys', () => {
      expect(() => validateDepthOverrides({ '': 2 })).toThrow();
    });

    it('should throw on non-object values', () => {
      expect(() => validateDepthOverrides('not-object' as any)).toThrow();
      expect(() => validateDepthOverrides(null as any)).toThrow();
    });
  });

  describe('isInRange', () => {
    it('should return true for values in range', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(1, 1, 10)).toBe(true);
      expect(isInRange(10, 1, 10)).toBe(true);
    });

    it('should return false for values out of range', () => {
      expect(isInRange(0, 1, 10)).toBe(false);
      expect(isInRange(11, 1, 10)).toBe(false);
      expect(isInRange(-5, 1, 10)).toBe(false);
    });
  });

  describe('parseCommitMessagePrefix', () => {
    it('should parse valid commit messages', () => {
      const result = parseCommitMessagePrefix('[src/core] Add validation');
      expect(result).toEqual({
        prefix: 'src/core',
        description: 'Add validation'
      });
    });

    it('should handle root and config prefixes', () => {
      expect(parseCommitMessagePrefix('[root] Fix bug')).toEqual({
        prefix: 'root',
        description: 'Fix bug'
      });

      expect(parseCommitMessagePrefix('[config] Update settings')).toEqual({
        prefix: 'config',
        description: 'Update settings'
      });
    });

    it('should return null for invalid formats', () => {
      expect(parseCommitMessagePrefix('No prefix here')).toBeNull();
      expect(parseCommitMessagePrefix('[] Empty prefix')).toBeNull();
      expect(parseCommitMessagePrefix('[prefix]')).toBeNull();
      expect(parseCommitMessagePrefix('[prefix]   ')).toBeNull();
    });

    it('should trim whitespace', () => {
      const result = parseCommitMessagePrefix('  [src/core]   Add validation  ');
      expect(result).toEqual({
        prefix: 'src/core',
        description: 'Add validation'
      });
    });
  });
});
