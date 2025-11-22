import type { Preset, PresetType, Config } from '../types.js';
import { FolderBasedPreset } from './folder-based.js';
import { ConventionalCommitsPreset } from './conventional-commits.js';

/**
 * Preset Registry
 * Manages all available presets and provides factory methods
 */
export class PresetRegistry {
  private static presets = new Map<PresetType, Preset>([
    ['folder-based', new FolderBasedPreset()],
    ['conventional-commits', new ConventionalCommitsPreset()]
  ]);

  /**
   * Get preset by type
   */
  static getPreset(type: PresetType): Preset {
    const preset = this.presets.get(type);
    if (!preset) {
      throw new Error(`Unknown preset type: ${type}. Available: ${Array.from(this.presets.keys()).join(', ')}`);
    }
    return preset;
  }

  /**
   * Get preset from config
   */
  static getPresetFromConfig(config: Config): Preset {
    return this.getPreset(config.preset);
  }

  /**
   * Get all available presets
   */
  static getAllPresets(): Map<PresetType, Preset> {
    return new Map(this.presets);
  }

  /**
   * List available preset names
   */
  static listPresetNames(): PresetType[] {
    return Array.from(this.presets.keys());
  }

  /**
   * Register a custom preset
   */
  static registerPreset(type: PresetType, preset: Preset): void {
    this.presets.set(type, preset);
  }
}

// Export presets for direct use
export { FolderBasedPreset } from './folder-based.js';
export { ConventionalCommitsPreset } from './conventional-commits.js';
