import { readFileSync } from 'fs';
import { join } from 'path';
import type { Config } from './types.js';
import {
  DEFAULT_DEPTH,
  DEFAULT_LOG_FILE,
  DEFAULT_MAX_FILES,
  DEFAULT_LOG_MAX_AGE_HOURS,
  DEFAULT_LANGUAGE,
  MIN_DEPTH,
  MAX_DEPTH,
  MIN_MAX_FILES,
  MAX_MAX_FILES,
  CONFIG_FILE
} from './constants.js';
import { isFileNotFoundError } from './utils/error.js';

export const DEFAULT_CONFIG: Config = {
  depth: DEFAULT_DEPTH,
  logFile: DEFAULT_LOG_FILE,
  enabled: true,
  ignorePaths: [],
  maxFiles: DEFAULT_MAX_FILES,
  verbose: false,
  logMaxAgeHours: DEFAULT_LOG_MAX_AGE_HOURS,
  language: DEFAULT_LANGUAGE
};

/**
 * Type guard to check if value is a plain object
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Safely extract config properties from parsed JSON
 * Only extracts known Config properties with proper type checking
 */
function extractConfigProps(obj: Record<string, unknown>): Partial<Config> {
  const result: Partial<Config> = {};

  if ('depth' in obj) result.depth = obj.depth as Config['depth'];
  if ('logFile' in obj) result.logFile = obj.logFile as Config['logFile'];
  if ('enabled' in obj) result.enabled = obj.enabled as Config['enabled'];
  if ('ignorePaths' in obj) result.ignorePaths = obj.ignorePaths as Config['ignorePaths'];
  if ('maxFiles' in obj) result.maxFiles = obj.maxFiles as Config['maxFiles'];
  if ('verbose' in obj) result.verbose = obj.verbose as Config['verbose'];
  if ('logMaxAgeHours' in obj) result.logMaxAgeHours = obj.logMaxAgeHours as Config['logMaxAgeHours'];
  if ('language' in obj) result.language = obj.language as Config['language'];

  return result;
}

/**
 * Load and validate configuration from .precommitrc.json
 * Falls back to default config if file doesn't exist
 * @returns Validated configuration object
 * @throws Error if config file exists but is invalid
 */
export function loadConfig(): Config {
  const configPath = join(process.cwd(), CONFIG_FILE);

  try {
    const configContent = readFileSync(configPath, 'utf-8');

    let userConfig: unknown;
    try {
      userConfig = JSON.parse(configContent);
    } catch {
      throw new Error(`Invalid JSON in ${CONFIG_FILE}. Please check the syntax.`);
    }

    if (!isPlainObject(userConfig)) {
      throw new Error(`${CONFIG_FILE} must contain a JSON object.`);
    }

    const config = { ...DEFAULT_CONFIG, ...extractConfigProps(userConfig) };
    validateConfig(config);
    return config;
  } catch (error: unknown) {
    // File not found - use defaults
    if (isFileNotFoundError(error)) {
      return DEFAULT_CONFIG;
    }
    throw error;
  }
}

function validateConfig(config: Config): void {
  if (typeof config.depth !== 'number' || config.depth < MIN_DEPTH || config.depth > MAX_DEPTH) {
    throw new Error(`Invalid depth: ${config.depth}. Must be a number between ${MIN_DEPTH} and ${MAX_DEPTH}.`);
  }

  if (config.maxFiles !== undefined) {
    if (typeof config.maxFiles !== 'number' || config.maxFiles < MIN_MAX_FILES || config.maxFiles > MAX_MAX_FILES) {
      throw new Error(`Invalid maxFiles: ${config.maxFiles}. Must be a number between ${MIN_MAX_FILES} and ${MAX_MAX_FILES}.`);
    }
  }

  if (!Array.isArray(config.ignorePaths)) {
    throw new Error('ignorePaths must be an array.');
  }

  if (!config.ignorePaths.every(p => typeof p === 'string')) {
    throw new Error('ignorePaths must contain only strings.');
  }

  if (config.verbose !== undefined && typeof config.verbose !== 'boolean') {
    throw new Error('verbose must be a boolean.');
  }

  if (config.language !== undefined && config.language !== 'en' && config.language !== 'ko') {
    throw new Error(`Invalid language: ${config.language}. Must be 'en' or 'ko'.`);
  }
}
