import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DynamicPresetRegistry, createRegistry } from '../../../../src/core/registry/registry.js';
import { PresetNotFoundError } from '../../../../src/core/errors.js';
import type { Preset } from '../../../../src/presets/base/types.js';

describe('DynamicPresetRegistry', () => {
  const createMockPreset = (name: string): Preset => ({
    name,
    description: `Mock ${name} preset`,
    validateFiles: vi.fn().mockReturnValue({ valid: true, files: [], errors: [], stats: { totalFiles: 0, filteredFiles: 0, ignoredFiles: 0, uniqueFolders: 0 } }),
    validateCommitMessage: vi.fn().mockReturnValue({ valid: true, errors: [] }),
    getCommitPrefix: vi.fn().mockReturnValue(`[${name}]`),
  });

  let registry: DynamicPresetRegistry;

  beforeEach(() => {
    registry = new DynamicPresetRegistry();
  });

  describe('register', () => {
    it('should register a preset', () => {
      const preset = createMockPreset('test');

      registry.register('test', preset);

      expect(registry.has('test')).toBe(true);
    });

    it('should call onRegister lifecycle hook', () => {
      const preset = createMockPreset('test');
      preset.onRegister = vi.fn();

      registry.register('test', preset);

      expect(preset.onRegister).toHaveBeenCalled();
    });

    it('should accept custom source type', () => {
      const preset = createMockPreset('test');

      registry.register('test', preset, 'builtin');

      const entry = registry.getEntry('test');
      expect(entry?.source).toBe('builtin');
    });
  });

  describe('getSync', () => {
    it('should return registered preset', () => {
      const preset = createMockPreset('test');
      registry.register('test', preset);

      const result = registry.getSync('test');

      expect(result).toBe(preset);
    });

    it('should throw PresetNotFoundError for unregistered preset', () => {
      expect(() => registry.getSync('unknown')).toThrow(PresetNotFoundError);
    });
  });

  describe('has', () => {
    it('should return true for registered preset', () => {
      const preset = createMockPreset('test');
      registry.register('test', preset);

      expect(registry.has('test')).toBe(true);
    });

    it('should return false for unregistered preset', () => {
      expect(registry.has('unknown')).toBe(false);
    });
  });

  describe('list', () => {
    it('should return empty array when no presets registered', () => {
      expect(registry.list()).toEqual([]);
    });

    it('should return all registered preset names', () => {
      registry.register('preset-a', createMockPreset('preset-a'));
      registry.register('preset-b', createMockPreset('preset-b'));

      const list = registry.list();

      expect(list).toContain('preset-a');
      expect(list).toContain('preset-b');
      expect(list).toHaveLength(2);
    });
  });

  describe('getAll', () => {
    it('should return all entries', () => {
      registry.register('test', createMockPreset('test'));

      const all = registry.getAll();

      expect(all.size).toBe(1);
      expect(all.has('test')).toBe(true);
    });
  });

  describe('getEntry', () => {
    it('should return entry with metadata', () => {
      const preset = createMockPreset('test');
      registry.register('test', preset, 'builtin');

      const entry = registry.getEntry('test');

      expect(entry).toBeDefined();
      expect(entry?.preset).toBe(preset);
      expect(entry?.source).toBe('builtin');
      expect(entry?.registeredAt).toBeInstanceOf(Date);
    });

    it('should return undefined for unregistered preset', () => {
      expect(registry.getEntry('unknown')).toBeUndefined();
    });
  });

  describe('unload', () => {
    it('should remove preset from registry', async () => {
      registry.register('test', createMockPreset('test'));

      await registry.unload('test');

      expect(registry.has('test')).toBe(false);
    });

    it('should call onUnload lifecycle hook', async () => {
      const preset = createMockPreset('test');
      preset.onUnload = vi.fn().mockResolvedValue(undefined);
      registry.register('test', preset);

      await registry.unload('test');

      expect(preset.onUnload).toHaveBeenCalled();
    });

    it('should not throw for unregistered preset', async () => {
      await expect(registry.unload('unknown')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all presets', async () => {
      registry.register('preset-a', createMockPreset('preset-a'));
      registry.register('preset-b', createMockPreset('preset-b'));

      await registry.clear();

      expect(registry.list()).toHaveLength(0);
    });

    it('should call onUnload for all presets', async () => {
      const presetA = createMockPreset('preset-a');
      const presetB = createMockPreset('preset-b');
      presetA.onUnload = vi.fn().mockResolvedValue(undefined);
      presetB.onUnload = vi.fn().mockResolvedValue(undefined);

      registry.register('preset-a', presetA);
      registry.register('preset-b', presetB);

      await registry.clear();

      expect(presetA.onUnload).toHaveBeenCalled();
      expect(presetB.onUnload).toHaveBeenCalled();
    });
  });

  describe('listBySource', () => {
    it('should filter presets by source', () => {
      registry.register('builtin-a', createMockPreset('builtin-a'), 'builtin');
      registry.register('builtin-b', createMockPreset('builtin-b'), 'builtin');
      registry.register('dynamic-a', createMockPreset('dynamic-a'), 'dynamic');

      const builtins = registry.listBySource('builtin');
      const dynamics = registry.listBySource('dynamic');

      expect(builtins).toContain('builtin-a');
      expect(builtins).toContain('builtin-b');
      expect(builtins).toHaveLength(2);
      expect(dynamics).toContain('dynamic-a');
      expect(dynamics).toHaveLength(1);
    });
  });

  describe('createRegistry', () => {
    it('should create registry instance', () => {
      const registry = createRegistry();

      expect(registry).toBeInstanceOf(DynamicPresetRegistry);
    });

    it('should accept options', () => {
      const registry = createRegistry({
        loaderOptions: { validate: true },
      });

      expect(registry).toBeInstanceOf(DynamicPresetRegistry);
    });
  });
});
