import { describe, it, expect } from 'vitest';
import { PluginResolver, createResolver } from '../../../../src/core/plugin/resolver.js';
import { PluginResolveError } from '../../../../src/core/errors.js';

describe('PluginResolver', () => {
  describe('resolve', () => {
    describe('builtin presets', () => {
      it('should resolve folder-based as builtin', () => {
        const resolver = new PluginResolver();
        const result = resolver.resolve('folder-based');

        expect(result.source).toBe('builtin');
        expect(result.metadata.name).toBe('folder-based');
        expect(result.path).toContain('presets');
      });

      it('should resolve conventional-commits as builtin', () => {
        const resolver = new PluginResolver();
        const result = resolver.resolve('conventional-commits');

        expect(result.source).toBe('builtin');
        expect(result.metadata.name).toBe('conventional-commits');
      });
    });

    describe('local paths', () => {
      it('should throw for non-existent local path', () => {
        const resolver = new PluginResolver();

        expect(() => resolver.resolve('./non-existent-plugin')).toThrow(PluginResolveError);
      });

      it('should throw for non-existent absolute path', () => {
        const resolver = new PluginResolver();

        expect(() => resolver.resolve('/absolute/non-existent')).toThrow(PluginResolveError);
      });

      it('should recognize relative path patterns', () => {
        const resolver = new PluginResolver();

        // These should all be recognized as local paths (even if they don't exist)
        expect(() => resolver.resolve('./my-plugin')).toThrow(PluginResolveError);
        expect(() => resolver.resolve('../my-plugin')).toThrow(PluginResolveError);
      });
    });

    describe('npm packages', () => {
      it('should throw for non-existent npm package', () => {
        const resolver = new PluginResolver();

        expect(() => resolver.resolve('precommit-plugin-nonexistent-12345')).toThrow(PluginResolveError);
      });
    });
  });

  describe('constructor options', () => {
    it('should accept custom cwd', () => {
      const resolver = new PluginResolver({ cwd: '/custom/path' });

      // Should still resolve builtins
      const result = resolver.resolve('folder-based');
      expect(result.source).toBe('builtin');
    });

    it('should accept search paths', () => {
      const resolver = new PluginResolver({
        searchPaths: ['/search/path1', '/search/path2'],
      });

      // Should still throw for non-existent paths
      expect(() => resolver.resolve('./my-plugin')).toThrow(PluginResolveError);
    });
  });

  describe('createResolver', () => {
    it('should create resolver with default options', () => {
      const resolver = createResolver();

      expect(resolver).toBeInstanceOf(PluginResolver);
    });

    it('should create resolver with custom options', () => {
      const resolver = createResolver({ cwd: '/custom' });

      expect(resolver).toBeInstanceOf(PluginResolver);
    });
  });
});
