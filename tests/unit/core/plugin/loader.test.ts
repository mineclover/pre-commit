import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PluginLoader, createLoader } from '../../../../src/core/plugin/loader.js';

describe('PluginLoader', () => {
  let loader: PluginLoader;

  beforeEach(() => {
    vi.clearAllMocks();
    loader = new PluginLoader({
      cwd: '/project',
      cache: true,
      validate: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create with default options', () => {
      const defaultLoader = new PluginLoader();
      expect(defaultLoader).toBeDefined();
    });

    it('should create with custom options', () => {
      const customLoader = new PluginLoader({
        searchPaths: ['/custom/path'],
        cache: false,
        validate: false,
        cwd: '/custom/cwd',
      });
      expect(customLoader).toBeDefined();
    });
  });

  describe('isLoaded', () => {
    it('should return false for unloaded plugin', () => {
      expect(loader.isLoaded('test-plugin')).toBe(false);
    });
  });

  describe('getCachedPlugins', () => {
    it('should return empty array when no plugins loaded', () => {
      expect(loader.getCachedPlugins()).toEqual([]);
    });
  });

  describe('unload', () => {
    it('should do nothing for unloaded plugin', async () => {
      await expect(loader.unload('not-loaded')).resolves.not.toThrow();
    });
  });

  describe('clearCache', () => {
    it('should clear empty cache without error', async () => {
      await expect(loader.clearCache()).resolves.not.toThrow();
    });
  });
});

describe('createLoader', () => {
  it('should create a PluginLoader instance', () => {
    const loader = createLoader({ cwd: '/test' });
    expect(loader).toBeInstanceOf(PluginLoader);
  });

  it('should create with default options', () => {
    const loader = createLoader();
    expect(loader).toBeInstanceOf(PluginLoader);
  });
});

describe('PluginLoader - private method behaviors', () => {
  describe('isPresetLike', () => {
    it('should identify valid preset-like objects', () => {
      const loader = new PluginLoader();

      // Access private method for testing
      const isPresetLike = (loader as any).isPresetLike.bind(loader);

      const validPreset = {
        name: 'test',
        validateFiles: () => ({ valid: true }),
        validateCommitMessage: () => ({ valid: true }),
        getCommitPrefix: () => '[test]',
      };

      expect(isPresetLike(validPreset)).toBe(true);
    });

    it('should reject invalid preset objects', () => {
      const loader = new PluginLoader();
      const isPresetLike = (loader as any).isPresetLike.bind(loader);

      expect(isPresetLike({ name: 'test' })).toBe(false);
      expect(isPresetLike(null)).toBe(false);
      expect(isPresetLike('string')).toBe(false);
      expect(isPresetLike(123)).toBe(false);
      expect(isPresetLike(undefined)).toBe(false);
    });
  });

  describe('isConstructor', () => {
    it('should identify class constructors', () => {
      const loader = new PluginLoader();
      const isConstructor = (loader as any).isConstructor.bind(loader);

      class TestClass {}
      expect(isConstructor(TestClass)).toBe(true);
    });

    it('should identify function constructors', () => {
      const loader = new PluginLoader();
      const isConstructor = (loader as any).isConstructor.bind(loader);

      function TestFunc() {}
      expect(isConstructor(TestFunc)).toBe(true);
    });

    it('should reject non-constructors', () => {
      const loader = new PluginLoader();
      const isConstructor = (loader as any).isConstructor.bind(loader);

      expect(isConstructor({})).toBe(false);
      expect(isConstructor(null)).toBe(false);
      expect(isConstructor('string')).toBe(false);
      expect(isConstructor(() => {})).toBe(false); // Arrow functions don't have proper prototype
    });
  });

  describe('extractPreset', () => {
    it('should extract default export', () => {
      const loader = new PluginLoader();
      const extractPreset = (loader as any).extractPreset.bind(loader);

      const preset = { name: 'test' };
      expect(extractPreset({ default: preset })).toBe(preset);
    });

    it('should extract named preset export', () => {
      const loader = new PluginLoader();
      const extractPreset = (loader as any).extractPreset.bind(loader);

      const preset = { name: 'test' };
      expect(extractPreset({ preset })).toBe(preset);
    });

    it('should extract named Preset export', () => {
      const loader = new PluginLoader();
      const extractPreset = (loader as any).extractPreset.bind(loader);

      const preset = { name: 'test' };
      expect(extractPreset({ Preset: preset })).toBe(preset);
    });

    it('should extract first preset-like object', () => {
      const loader = new PluginLoader();
      const extractPreset = (loader as any).extractPreset.bind(loader);

      const validPreset = {
        name: 'test',
        validateFiles: () => ({ valid: true }),
        validateCommitMessage: () => ({ valid: true }),
        getCommitPrefix: () => '[test]',
      };

      expect(extractPreset({ myCustomPreset: validPreset })).toBe(validPreset);
    });

    it('should return null for empty module', () => {
      const loader = new PluginLoader();
      const extractPreset = (loader as any).extractPreset.bind(loader);

      expect(extractPreset({})).toBeNull();
    });

    it('should prefer default over named exports', () => {
      const loader = new PluginLoader();
      const extractPreset = (loader as any).extractPreset.bind(loader);

      const defaultPreset = { name: 'default' };
      const namedPreset = { name: 'named' };

      expect(extractPreset({ default: defaultPreset, preset: namedPreset })).toBe(defaultPreset);
    });
  });

  describe('callLifecycle', () => {
    it('should call lifecycle method when present', async () => {
      const loader = new PluginLoader();
      const callLifecycle = (loader as any).callLifecycle.bind(loader);

      const onRegisterMock = vi.fn();
      const preset = { name: 'test', onRegister: onRegisterMock };

      await callLifecycle(preset, 'onRegister');
      expect(onRegisterMock).toHaveBeenCalled();
    });

    it('should not throw when lifecycle method is missing', async () => {
      const loader = new PluginLoader();
      const callLifecycle = (loader as any).callLifecycle.bind(loader);

      const preset = { name: 'test' };
      await expect(callLifecycle(preset, 'onRegister')).resolves.not.toThrow();
    });

    it('should handle async lifecycle methods', async () => {
      const loader = new PluginLoader();
      const callLifecycle = (loader as any).callLifecycle.bind(loader);

      const onUnloadMock = vi.fn().mockResolvedValue(undefined);
      const preset = { name: 'test', onUnload: onUnloadMock };

      await callLifecycle(preset, 'onUnload');
      expect(onUnloadMock).toHaveBeenCalled();
    });

    it('should call lifecycle method with correct context', async () => {
      const loader = new PluginLoader();
      const callLifecycle = (loader as any).callLifecycle.bind(loader);

      let capturedThis: any = null;
      const preset = {
        name: 'test',
        onRegister: function() {
          capturedThis = this;
        }
      };

      await callLifecycle(preset, 'onRegister');
      expect(capturedThis).toBe(preset);
    });
  });
});

describe('PluginLoader - cache behavior', () => {
  it('should respect cache option when disabled', async () => {
    const loaderWithCache = new PluginLoader({ cache: true });
    const loaderWithoutCache = new PluginLoader({ cache: false });

    expect(loaderWithCache.getCachedPlugins()).toEqual([]);
    expect(loaderWithoutCache.getCachedPlugins()).toEqual([]);
  });
});
