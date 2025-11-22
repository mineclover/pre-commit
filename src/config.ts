import { readFileSync } from 'fs';
import { join } from 'path';
import type { Config, FolderBasedConfig } from './types.js';

/**
 * Default configuration for folder-based preset
 * (maintains backward compatibility)
 */
const DEFAULT_CONFIG: FolderBasedConfig = {
  preset: 'folder-based',
  depth: 2,
  logFile: '.commit-logs/violations.log',
  enabled: true,
  ignorePaths: [],
  maxFiles: 100,
  verbose: false,
  logMaxAgeHours: 24,
  language: 'en'
};

/**
 * Load configuration from .precommitrc.json
 * Falls back to default folder-based preset if not found
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
  } catch (error: any) {
    if (error.code === 'ENOENT') {
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
  const validPresets = ['folder-based', 'conventional-commits', 'custom'];
  if (!validPresets.includes(config.preset)) {
    throw new Error(`Invalid preset: ${config.preset}. Must be one of: ${validPresets.join(', ')}`);
  }

  // Preset-specific validation
  if (config.preset === 'folder-based') {
    const folderConfig = config as FolderBasedConfig;

    if (folderConfig.depth < 1 || folderConfig.depth > 10) {
      throw new Error(`Invalid depth: ${folderConfig.depth}. Must be between 1 and 10.`);
    }

    if (folderConfig.maxFiles && (folderConfig.maxFiles < 1 || folderConfig.maxFiles > 1000)) {
      throw new Error(`Invalid maxFiles: ${folderConfig.maxFiles}. Must be between 1 and 1000.`);
    }

    if (!Array.isArray(folderConfig.ignorePaths)) {
      throw new Error('ignorePaths must be an array');
    }
  }
}
