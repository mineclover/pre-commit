/**
 * @module core/plugin/types
 * @description Type definitions for the plugin system
 */

import type { Preset } from '../../presets/base/types.js';
import type { BaseConfig } from '../types.js';

/**
 * Plugin metadata for discovery and documentation
 */
export interface PluginMetadata {
  /** Unique plugin name */
  name: string;
  /** Semantic version */
  version: string;
  /** Human-readable description */
  description: string;
  /** Plugin author */
  author?: string;
  /** Repository URL */
  repository?: string;
  /** Keywords for discovery */
  keywords?: string[];
  /** Engine requirements */
  engines?: {
    node?: string;
  };
}

/**
 * Plugin manifest structure (in package.json or plugin.json)
 */
export interface PluginManifest {
  precommit: {
    /** Entry point for preset (relative to plugin root) */
    preset: string;
    /** JSON Schema file for config validation */
    configSchema?: string;
  };
}

/**
 * Plugin source type
 */
export type PluginSource = 'local' | 'npm' | 'builtin';

/**
 * Plugin resolution result
 */
export interface ResolvedPlugin {
  /** Absolute path to plugin root */
  path: string;
  /** Plugin metadata from package.json */
  metadata: PluginMetadata;
  /** Plugin manifest configuration */
  manifest: PluginManifest;
  /** Source of the plugin */
  source: PluginSource;
}

/**
 * Loaded plugin instance
 */
export interface LoadedPlugin<TConfig extends BaseConfig = BaseConfig> {
  /** Resolved plugin information */
  resolved: ResolvedPlugin;
  /** Preset instance */
  preset: Preset<TConfig>;
  /** Whether the plugin is loaded */
  loaded: boolean;
}

/**
 * Plugin loader options
 */
export interface PluginLoaderOptions {
  /** Additional search paths for local plugins */
  searchPaths?: string[];
  /** Cache loaded plugins */
  cache?: boolean;
  /** Validate plugin interface on load */
  validate?: boolean;
  /** Working directory for relative path resolution */
  cwd?: string;
}

/**
 * Plugin resolver options
 */
export interface PluginResolverOptions {
  /** Working directory for relative path resolution */
  cwd?: string;
  /** Additional search paths */
  searchPaths?: string[];
}
