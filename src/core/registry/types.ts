/**
 * @module core/registry/types
 * @description Type definitions for the preset registry system
 */

import type { Preset } from '../../presets/base/types.js';
import type { BaseConfig } from '../types.js';
import type { PluginLoaderOptions } from '../plugin/types.js';

/**
 * Registry entry with metadata
 */
export interface RegistryEntry<TConfig extends BaseConfig = BaseConfig> {
  /** Preset instance */
  preset: Preset<TConfig>;
  /** Source of the preset */
  source: 'builtin' | 'local' | 'npm' | 'dynamic';
  /** When the preset was registered */
  registeredAt: Date;
  /** Original specifier used to load (if external) */
  specifier?: string;
}

/**
 * Options for the preset registry
 */
export interface RegistryOptions {
  /** Plugin loader options for external presets */
  loaderOptions?: PluginLoaderOptions;
  /** Auto-register builtin presets on construction */
  registerBuiltins?: boolean;
}

/**
 * Preset discovery options
 */
export interface DiscoveryOptions {
  /** Patterns to search for plugin packages */
  patterns?: string[];
  /** Directories to search in */
  searchDirs?: string[];
  /** Include devDependencies */
  includeDevDeps?: boolean;
}

/**
 * Discovery result for a found preset
 */
export interface DiscoveredPreset {
  /** Package or path name */
  name: string;
  /** Full path to the preset */
  path: string;
  /** Source type */
  source: 'npm' | 'local';
  /** Package version (if available) */
  version?: string;
}
