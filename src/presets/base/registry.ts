import type { Preset } from './types.js';
import type { BaseConfig, PresetName } from '../../core/types.js';
import { PresetNotFoundError } from '../../core/errors.js';
import { DynamicPresetRegistry } from '../../core/registry/registry.js';

// Internal dynamic registry for async operations
const dynamicRegistry = new DynamicPresetRegistry();

/**
 * Preset Registry
 * Central registry for all available presets
 *
 * This class provides a static API for backward compatibility while
 * supporting dynamic loading via getAsync().
 */
export class PresetRegistry {
  private static readonly presets = new Map<string, Preset<BaseConfig>>();

  /**
   * Register a preset
   * @param name - Unique preset identifier
   * @param preset - Preset implementation
   */
  static register<TConfig extends BaseConfig>(name: PresetName | string, preset: Preset<TConfig>): void {
    this.presets.set(name, preset as Preset<BaseConfig>);
    // Also register in dynamic registry
    dynamicRegistry.register(name, preset, 'builtin');
  }

  /**
   * Get preset by name (synchronous - only for registered presets)
   * @param name - Preset identifier
   * @returns Preset implementation
   * @throws {PresetNotFoundError} If preset is not registered
   */
  static get(name: string): Preset<BaseConfig> {
    const preset = this.presets.get(name);
    if (!preset) {
      throw new PresetNotFoundError(name, this.list());
    }
    return preset;
  }

  /**
   * Get preset by name (async - loads dynamically if needed)
   * @param name - Preset identifier or plugin specifier
   * @returns Preset implementation
   */
  static async getAsync(name: string): Promise<Preset<BaseConfig>> {
    // Check static registry first
    if (this.presets.has(name)) {
      return this.presets.get(name)!;
    }
    // Fall back to dynamic loading
    return dynamicRegistry.get(name);
  }

  /**
   * Check if preset exists
   * @param name - Preset identifier
   * @returns True if preset is registered
   */
  static has(name: string): boolean {
    return this.presets.has(name);
  }

  /**
   * Get all registered preset names
   * @returns Array of preset names
   */
  static list(): string[] {
    return Array.from(this.presets.keys());
  }

  /**
   * Get all presets
   * @returns Map of all registered presets
   */
  static getAll(): ReadonlyMap<string, Preset<BaseConfig>> {
    return this.presets;
  }

  /**
   * Get the underlying dynamic registry for advanced operations
   * @returns DynamicPresetRegistry instance
   */
  static getDynamicRegistry(): DynamicPresetRegistry {
    return dynamicRegistry;
  }
}
