/**
 * @module core/plugin
 * @description Plugin system for loading external presets
 *
 * This module provides the infrastructure for loading presets from:
 * - Local file paths (./my-preset or /absolute/path)
 * - NPM packages (precommit-plugin-eslint)
 * - Builtin presets (folder-based, conventional-commits)
 *
 * @example
 * ```typescript
 * import { PluginLoader } from './plugin';
 *
 * const loader = new PluginLoader({ cache: true, validate: true });
 *
 * // Load a local plugin
 * const localPlugin = await loader.load('./my-preset');
 *
 * // Load an npm package
 * const npmPlugin = await loader.load('precommit-plugin-eslint');
 *
 * // Use the preset
 * const result = localPlugin.preset.validateFiles(files, config);
 * ```
 */

// Types
export type {
  PluginMetadata,
  PluginManifest,
  PluginSource,
  ResolvedPlugin,
  LoadedPlugin,
  PluginLoaderOptions,
  PluginResolverOptions,
} from './types.js';

// Classes
export { PluginLoader, createLoader } from './loader.js';
export { PluginResolver, createResolver } from './resolver.js';
export { PluginValidator, createValidator, defaultValidator } from './validator.js';
export type { ValidationResult as PluginValidationResult } from './validator.js';
