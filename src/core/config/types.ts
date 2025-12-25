/**
 * @module core/config/types
 * @description Extended configuration types with inheritance and environment support
 */

import type { BaseConfig } from '../types.js';
import type { PipelineConfig } from '../pipeline/types.js';
import type { Preset } from '../../presets/base/types.js';

/**
 * Conditional configuration based on runtime conditions
 */
export interface ConditionalConfig {
  /** Condition to match */
  when: {
    /** Branch patterns to match */
    branch?: string | string[];
    /** Environment variables to match */
    env?: Record<string, string>;
    /** File patterns to match */
    files?: string[];
  };
  /** Configuration to apply when condition matches */
  config: Partial<ExtendedConfig>;
}

/**
 * Extended configuration with inheritance and environment support
 */
export interface ExtendedConfig extends BaseConfig {
  /** Extend from another config file or preset */
  extends?: string | string[];

  /** Environment variable defaults */
  $env?: Record<string, string>;

  /** Conditional configurations */
  conditionals?: ConditionalConfig[];

  /** Pipeline configuration for multi-preset validation */
  pipeline?: PipelineConfig;

  /** External plugin references */
  plugins?: string[];

  /** Preset-specific configurations */
  presets?: Record<string, unknown>;
}

/**
 * Resolved configuration after processing extends, env, and conditionals
 */
export interface ResolvedConfig extends BaseConfig {
  /** Source files that contributed to this config */
  _sources: string[];

  /** Resolved preset instances */
  _presets: Map<string, Preset>;

  /** Active pipeline config */
  _pipeline?: PipelineConfig;

  /** Resolved environment variables */
  _resolvedEnv?: Record<string, string>;
}

/**
 * Config loader options
 */
export interface ConfigLoaderOptions {
  /** Working directory */
  cwd?: string;

  /** Custom config file path */
  configPath?: string;

  /** Environment variables to use for interpolation */
  env?: Record<string, string>;

  /** Current git branch (for conditionals) */
  branch?: string;

  /** Staged files (for conditionals) */
  stagedFiles?: string[];

  /** Skip validation */
  skipValidation?: boolean;
}

/**
 * Config file search result
 */
export interface ConfigFileInfo {
  /** Absolute path to config file */
  path: string;

  /** Config file format */
  format: 'json' | 'js' | 'ts' | 'package';

  /** Whether config was found in package.json */
  isPackageJson: boolean;
}
