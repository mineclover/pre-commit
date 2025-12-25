import { readFileSync } from 'fs';
import { join } from 'path';
import type { FolderBasedConfig } from '../presets/folder-based/types.js';
import type { ConventionalCommitsConfig } from '../presets/conventional-commits/types.js';
import {
  DEPTH_CONSTRAINTS,
  FILE_CONSTRAINTS,
  LOG_DEFAULTS,
  PRESET_NAMES,
} from './constants.js';
import {
  validateDepth,
  validateMaxFiles,
  validatePathArray,
  validateDepthOverrides,
} from './utils/validation-utils.js';
import { ConfigValidationError } from './errors.js';
import { isFileNotFoundError } from './types.js';

/**
 * Union type for all preset configs
 */
export type Config = FolderBasedConfig | ConventionalCommitsConfig;

/**
 * Default configuration for folder-based preset
 * (maintains backward compatibility)
 */
const DEFAULT_CONFIG: FolderBasedConfig = {
  preset: PRESET_NAMES.FOLDER_BASED,
  depth: DEPTH_CONSTRAINTS.DEFAULT,
  logFile: LOG_DEFAULTS.FILE_PATH,
  enabled: true,
  ignorePaths: [],
  maxFiles: FILE_CONSTRAINTS.DEFAULT_MAX_FILES,
  verbose: false,
  logMaxAgeHours: LOG_DEFAULTS.MAX_AGE_HOURS,
  language: 'en'
};

/**
 * Load and validate configuration from .precommitrc.json
 *
 * Reads the configuration file from the current working directory and validates it.
 * If the file doesn't exist, returns the default folder-based configuration.
 * If no preset is specified in the config file, defaults to 'folder-based' for
 * backward compatibility.
 *
 * @returns Validated configuration object
 * @throws {ConfigValidationError} If configuration is invalid
 * @throws {SyntaxError} If JSON parsing fails
 *
 * @example
 * // With .precommitrc.json present
 * const config = loadConfig();
 * console.log(config.preset); // "folder-based" or "conventional-commits"
 *
 * @example
 * // Without .precommitrc.json (uses defaults)
 * const config = loadConfig();
 * // Returns: { preset: 'folder-based', depth: 3, enabled: true, ... }
 */
export function loadConfig(): Config {
  try {
    const configPath = join(process.cwd(), '.precommitrc.json');
    const configContent = readFileSync(configPath, 'utf-8');
    const userConfig = JSON.parse(configContent);

    // If no preset specified, default to folder-based for backward compatibility
    if (!userConfig.preset) {
      userConfig.preset = 'folder-based';
    }

    const config = { ...DEFAULT_CONFIG, ...userConfig } as Config;
    validateConfig(config);
    return config;
  } catch (error: unknown) {
    if (isFileNotFoundError(error)) {
      return DEFAULT_CONFIG;
    }
    throw error;
  }
}

/**
 * Validate configuration based on preset type
 */
function validateConfig(config: Config): void {
  // Validate preset type
  const validPresets = [PRESET_NAMES.FOLDER_BASED, PRESET_NAMES.CONVENTIONAL_COMMITS];
  if (!validPresets.includes(config.preset)) {
    throw new ConfigValidationError(
      `Invalid preset: ${config.preset}. Must be one of: ${validPresets.join(', ')}`,
      'preset',
      config.preset
    );
  }

  // Preset-specific validation
  if (config.preset === PRESET_NAMES.FOLDER_BASED) {
    const folderConfig = config as FolderBasedConfig;

    try {
      // Validate depth
      validateDepth(folderConfig.depth, 'depth');

      // Validate maxDepth (for auto mode)
      if (folderConfig.maxDepth !== undefined) {
        validateDepth(folderConfig.maxDepth, 'maxDepth');
      }

      // Validate depthOverrides
      validateDepthOverrides(folderConfig.depthOverrides);

      // Validate maxFiles
      validateMaxFiles(folderConfig.maxFiles);

      // Validate ignorePaths
      validatePathArray(folderConfig.ignorePaths, 'ignorePaths');

    } catch (error) {
      if (error instanceof ConfigValidationError) {
        throw error;
      }
      throw new ConfigValidationError((error as Error).message);
    }
  }
}
