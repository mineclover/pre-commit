import type { Preset } from './types.js';
import type { BaseConfig, PresetName } from '../../core/types.js';
import { PresetNotFoundError } from '../../core/errors.js';

/**
 * Preset Registry
 * Central registry for all available presets
 */
export class PresetRegistry {
  private static readonly presets = new Map<string, Preset<BaseConfig>>();

  /**
   * Register a preset
   * @param name - Unique preset identifier
   * @param preset - Preset implementation
   */
  static register<TConfig extends BaseConfig>(name: PresetName, preset: Preset<TConfig>): void {
    this.presets.set(name, preset as Preset<BaseConfig>);
  }

  /**
   * Get preset by name
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
}
