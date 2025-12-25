/**
 * @module core/plugin/loader
 * @description Plugin loading and management
 */

import { join } from 'path';
import { pathToFileURL } from 'url';
import type { Preset } from '../../presets/base/types.js';
import type { BaseConfig } from '../types.js';
import type {
  PluginLoaderOptions,
  ResolvedPlugin,
  LoadedPlugin,
} from './types.js';
import { PluginResolver } from './resolver.js';
import { PluginValidator } from './validator.js';
import { PluginLoadError } from '../errors.js';

/**
 * Loads and manages plugin presets
 */
export class PluginLoader {
  private readonly resolver: PluginResolver;
  private readonly validator: PluginValidator;
  private readonly cache: Map<string, LoadedPlugin>;
  private readonly options: Required<PluginLoaderOptions>;

  constructor(options: PluginLoaderOptions = {}) {
    this.options = {
      searchPaths: options.searchPaths || [],
      cache: options.cache ?? true,
      validate: options.validate ?? true,
      cwd: options.cwd || process.cwd(),
    };

    this.resolver = new PluginResolver({
      cwd: this.options.cwd,
      searchPaths: this.options.searchPaths,
    });
    this.validator = new PluginValidator();
    this.cache = new Map();
  }

  /**
   * Load a plugin by specifier
   * @param specifier - Plugin specifier (local path, npm package, or builtin)
   * @returns Loaded plugin with preset instance
   * @throws {PluginLoadError} If plugin cannot be loaded
   */
  async load<TConfig extends BaseConfig = BaseConfig>(
    specifier: string
  ): Promise<LoadedPlugin<TConfig>> {
    // Check cache first
    if (this.options.cache && this.cache.has(specifier)) {
      return this.cache.get(specifier) as LoadedPlugin<TConfig>;
    }

    // Resolve plugin path
    const resolved = this.resolver.resolve(specifier);

    // Import and instantiate preset
    const preset = await this.importPreset<TConfig>(resolved);

    // Validate if enabled
    if (this.options.validate) {
      this.validator.assertValid(preset, resolved.metadata.name);
    }

    const loadedPlugin: LoadedPlugin<TConfig> = {
      resolved,
      preset,
      loaded: true,
    };

    // Cache if enabled
    if (this.options.cache) {
      this.cache.set(specifier, loadedPlugin as LoadedPlugin);
    }

    return loadedPlugin;
  }

  /**
   * Load multiple plugins
   * @param specifiers - Array of plugin specifiers
   * @returns Map of specifier to loaded plugin
   */
  async loadAll(specifiers: string[]): Promise<Map<string, LoadedPlugin>> {
    const results = new Map<string, LoadedPlugin>();

    await Promise.all(
      specifiers.map(async (specifier) => {
        try {
          const plugin = await this.load(specifier);
          results.set(specifier, plugin);
        } catch (error) {
          // Re-throw with context
          if (error instanceof PluginLoadError) {
            throw error;
          }
          throw new PluginLoadError(
            `Failed to load plugin: ${specifier}`,
            specifier,
            error instanceof Error ? error : undefined
          );
        }
      })
    );

    return results;
  }

  /**
   * Check if a plugin is loaded and cached
   * @param specifier - Plugin specifier
   */
  isLoaded(specifier: string): boolean {
    return this.cache.has(specifier);
  }

  /**
   * Unload a cached plugin
   * @param specifier - Plugin specifier
   */
  async unload(specifier: string): Promise<void> {
    const plugin = this.cache.get(specifier);
    if (plugin) {
      // Call lifecycle hook if available
      await this.callLifecycle(plugin.preset, 'onUnload');
      this.cache.delete(specifier);
    }
  }

  /**
   * Clear all cached plugins
   */
  async clearCache(): Promise<void> {
    for (const [specifier] of this.cache) {
      await this.unload(specifier);
    }
  }

  /**
   * Get list of cached plugin specifiers
   */
  getCachedPlugins(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Import preset from resolved plugin
   */
  private async importPreset<TConfig extends BaseConfig>(
    resolved: ResolvedPlugin
  ): Promise<Preset<TConfig>> {
    const entryPath = join(resolved.path, resolved.manifest.precommit.preset);

    try {
      // Convert to file URL for ESM import
      const entryUrl = pathToFileURL(entryPath).href;
      const module = await import(entryUrl);

      // Support various export patterns
      const PresetExport = this.extractPreset(module);

      if (!PresetExport) {
        throw new PluginLoadError(
          `No preset export found in ${resolved.metadata.name}`,
          resolved.metadata.name
        );
      }

      // If it's a class/constructor, instantiate it
      if (this.isConstructor(PresetExport)) {
        const instance = new PresetExport() as Preset<TConfig>;
        await this.callLifecycle(instance, 'onRegister');
        return instance;
      }

      // If it's already an instance
      const preset = PresetExport as Preset<TConfig>;
      await this.callLifecycle(preset, 'onRegister');
      return preset;
    } catch (error) {
      if (error instanceof PluginLoadError) {
        throw error;
      }
      throw new PluginLoadError(
        `Failed to import preset from ${resolved.metadata.name}: ${error instanceof Error ? error.message : String(error)}`,
        resolved.metadata.name,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Extract preset from module exports
   */
  private extractPreset(module: Record<string, unknown>): unknown {
    // Priority order: default > preset > Preset > first export
    if (module.default) {
      return module.default;
    }
    if (module.preset) {
      return module.preset;
    }
    if (module.Preset) {
      return module.Preset;
    }

    // Find first export that looks like a preset
    for (const value of Object.values(module)) {
      if (this.isPresetLike(value) || this.isConstructor(value)) {
        return value;
      }
    }

    return null;
  }

  /**
   * Check if value looks like a preset (has required properties)
   */
  private isPresetLike(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    const obj = value as Record<string, unknown>;
    return (
      typeof obj.name === 'string' &&
      typeof obj.validateFiles === 'function' &&
      typeof obj.validateCommitMessage === 'function' &&
      typeof obj.getCommitPrefix === 'function'
    );
  }

  /**
   * Check if value is a constructor function
   */
  private isConstructor(value: unknown): value is new () => Preset {
    return (
      typeof value === 'function' &&
      value.prototype !== undefined &&
      value.prototype.constructor === value
    );
  }

  /**
   * Call lifecycle method if it exists
   */
  private async callLifecycle(
    preset: Preset,
    method: 'onRegister' | 'onUnload'
  ): Promise<void> {
    const fn = preset[method];
    if (fn && typeof fn === 'function') {
      await fn.call(preset);
    }
  }
}

/**
 * Create a new plugin loader with options
 */
export function createLoader(options?: PluginLoaderOptions): PluginLoader {
  return new PluginLoader(options);
}
