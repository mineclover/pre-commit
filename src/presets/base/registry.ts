import type { Preset } from './types.js';

/**
 * Preset Registry
 * Central registry for all available presets
 */
export class PresetRegistry {
  private static presets = new Map<string, Preset>();

  /**
   * Register a preset
   */
  static register(name: string, preset: Preset): void {
    this.presets.set(name, preset);
  }

  /**
   * Get preset by name
   */
  static get(name: string): Preset {
    const preset = this.presets.get(name);
    if (!preset) {
      throw new Error(
        `Unknown preset: "${name}". Available presets: ${Array.from(this.presets.keys()).join(', ')}`
      );
    }
    return preset;
  }

  /**
   * Check if preset exists
   */
  static has(name: string): boolean {
    return this.presets.has(name);
  }

  /**
   * Get all registered preset names
   */
  static list(): string[] {
    return Array.from(this.presets.keys());
  }

  /**
   * Get all presets
   */
  static getAll(): Map<string, Preset> {
    return new Map(this.presets);
  }
}
