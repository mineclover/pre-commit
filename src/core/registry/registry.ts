/**
 * @module core/registry/registry
 * @description Dynamic preset registry with on-demand loading
 */

import type { Preset } from '../../presets/base/types.js';
import type { BaseConfig } from '../types.js';
import type { RegistryEntry, RegistryOptions } from './types.js';
import type { PresetPropertySchema, PropertyValidationResult, ValidationOptions } from './property-types.js';
import { PluginLoader } from '../plugin/loader.js';
import { ConfigPropertyRegistry } from './property-registry.js';
import { PresetNotFoundError } from '../errors.js';

/**
 * Dynamic preset registry with support for lazy loading external presets
 *
 * @example
 * ```typescript
 * const registry = new DynamicPresetRegistry();
 *
 * // Register a builtin preset
 * registry.register('folder-based', folderBasedPreset, 'builtin');
 *
 * // Get a preset (loads dynamically if not registered)
 * const preset = await registry.get('folder-based');
 *
 * // Check if registered
 * if (registry.has('my-preset')) { ... }
 * ```
 */
export class DynamicPresetRegistry {
  private readonly entries = new Map<string, RegistryEntry>();
  private readonly loader: PluginLoader;
  private readonly loading = new Map<string, Promise<Preset>>();
  private readonly propertyRegistry: ConfigPropertyRegistry;

  constructor(options: RegistryOptions = {}) {
    this.loader = new PluginLoader(options.loaderOptions);
    this.propertyRegistry = new ConfigPropertyRegistry();
  }

  /**
   * Get the property registry for config validation
   */
  getPropertyRegistry(): ConfigPropertyRegistry {
    return this.propertyRegistry;
  }

  /**
   * Register a preset directly
   * @param name - Unique preset identifier
   * @param preset - Preset instance
   * @param source - Source of the preset
   * @param propertySchema - Optional property schema for config validation
   */
  register<TConfig extends BaseConfig>(
    name: string,
    preset: Preset<TConfig>,
    source: RegistryEntry['source'] = 'dynamic',
    propertySchema?: PresetPropertySchema
  ): void {
    const entry: RegistryEntry<TConfig> = {
      preset,
      source,
      registeredAt: new Date(),
    };
    this.entries.set(name, entry as RegistryEntry);

    // Register property schema if provided
    if (propertySchema) {
      this.propertyRegistry.registerSchema(propertySchema);
    } else if (preset.configSchema) {
      // Try to extract from preset's configSchema
      this.registerSchemaFromPreset(name, preset);
    }

    // Call lifecycle hook
    if (preset.onRegister) {
      preset.onRegister();
    }
  }

  /**
   * Register property schema for a preset
   */
  registerPropertySchema(schema: PresetPropertySchema): void {
    this.propertyRegistry.registerSchema(schema);
  }

  /**
   * Validate configuration for a preset
   */
  validateConfig(
    preset: string,
    config: Record<string, unknown>,
    options?: ValidationOptions
  ): PropertyValidationResult {
    return this.propertyRegistry.validate(preset, config, options);
  }

  /**
   * Apply defaults to configuration
   */
  applyConfigDefaults(
    preset: string,
    config: Record<string, unknown>
  ): Record<string, unknown> {
    return this.propertyRegistry.applyDefaults(preset, config);
  }

  /**
   * Extract and register schema from preset's configSchema
   */
  private registerSchemaFromPreset(name: string, preset: Preset): void {
    if (!preset.configSchema) return;

    // Basic JSON Schema to PropertySchema conversion
    const jsonSchema = preset.configSchema as Record<string, unknown>;
    if (jsonSchema.properties && typeof jsonSchema.properties === 'object') {
      this.propertyRegistry.registerSchema({
        preset: name,
        properties: {},
        additionalProperties: true,
      });
    }
  }

  /**
   * Get a preset by name (async - loads dynamically if needed)
   * @param name - Preset identifier
   * @returns Preset instance
   * @throws {PresetNotFoundError} If preset cannot be found or loaded
   */
  async get(name: string): Promise<Preset<BaseConfig>> {
    // Check if already registered
    const entry = this.entries.get(name);
    if (entry) {
      return entry.preset;
    }

    // Check if currently loading
    const loadingPromise = this.loading.get(name);
    if (loadingPromise) {
      return loadingPromise;
    }

    // Try to load as external plugin
    const loadPromise = this.loadExternal(name);
    this.loading.set(name, loadPromise);

    try {
      const preset = await loadPromise;
      return preset;
    } catch (error) {
      // Remove from loading map on failure
      this.loading.delete(name);
      throw error;
    }
  }

  /**
   * Get a preset synchronously (throws if not already registered)
   * @param name - Preset identifier
   * @returns Preset instance
   * @throws {PresetNotFoundError} If preset is not registered
   */
  getSync(name: string): Preset<BaseConfig> {
    const entry = this.entries.get(name);
    if (!entry) {
      throw new PresetNotFoundError(name, this.list());
    }
    return entry.preset;
  }

  /**
   * Check if a preset is registered
   * @param name - Preset identifier
   * @returns True if preset is registered
   */
  has(name: string): boolean {
    return this.entries.has(name);
  }

  /**
   * List all registered preset names
   * @returns Array of preset names
   */
  list(): string[] {
    return Array.from(this.entries.keys());
  }

  /**
   * Get all registry entries
   * @returns Map of name to entry
   */
  getAll(): ReadonlyMap<string, RegistryEntry> {
    return this.entries;
  }

  /**
   * Get entry with metadata
   * @param name - Preset identifier
   * @returns Registry entry or undefined
   */
  getEntry(name: string): RegistryEntry | undefined {
    return this.entries.get(name);
  }

  /**
   * Unload a preset
   * @param name - Preset identifier
   */
  async unload(name: string): Promise<void> {
    const entry = this.entries.get(name);
    if (entry) {
      // Call lifecycle hook
      if (entry.preset.onUnload) {
        await entry.preset.onUnload();
      }
      this.entries.delete(name);
      this.loading.delete(name);
    }
  }

  /**
   * Clear all registered presets
   */
  async clear(): Promise<void> {
    for (const [name] of this.entries) {
      await this.unload(name);
    }
  }

  /**
   * Get presets by source type
   * @param source - Source type filter
   * @returns Array of preset names
   */
  listBySource(source: RegistryEntry['source']): string[] {
    return Array.from(this.entries.entries())
      .filter(([, entry]) => entry.source === source)
      .map(([name]) => name);
  }

  /**
   * Load an external preset
   */
  private async loadExternal(specifier: string): Promise<Preset> {
    try {
      const loaded = await this.loader.load(specifier);

      // Register the loaded preset
      this.register(specifier, loaded.preset, loaded.resolved.source);

      // Also register by preset name if different
      if (loaded.preset.name !== specifier) {
        this.register(loaded.preset.name, loaded.preset, loaded.resolved.source);
      }

      this.loading.delete(specifier);
      return loaded.preset;
    } catch (error) {
      throw new PresetNotFoundError(specifier, this.list());
    }
  }
}

/**
 * Create a new dynamic preset registry
 */
export function createRegistry(options?: RegistryOptions): DynamicPresetRegistry {
  return new DynamicPresetRegistry(options);
}
