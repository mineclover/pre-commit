import { readFileSync } from 'fs';
import { join } from 'path';
import type { Config } from './types.js';

const DEFAULT_CONFIG: Config = {
  depth: 2,
  logFile: '.commit-logs/violations.log',
  enabled: true,
  ignorePaths: [],
  maxFiles: 100,
  verbose: false,
  logMaxAgeHours: 24,
  language: 'en'
};

export function loadConfig(): Config {
  try {
    const configPath = join(process.cwd(), '.precommitrc.json');
    const configContent = readFileSync(configPath, 'utf-8');
    const userConfig = JSON.parse(configContent);
    const config = { ...DEFAULT_CONFIG, ...userConfig };
    validateConfig(config);
    return config;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return DEFAULT_CONFIG;
    }
    throw error;
  }
}

function validateConfig(config: Config): void {
  if (config.depth < 1 || config.depth > 10) {
    throw new Error(`Invalid depth: ${config.depth}. Must be between 1 and 10.`);
  }

  if (config.maxFiles && (config.maxFiles < 1 || config.maxFiles > 1000)) {
    throw new Error(`Invalid maxFiles: ${config.maxFiles}. Must be between 1 and 1000.`);
  }

  if (!Array.isArray(config.ignorePaths)) {
    throw new Error('ignorePaths must be an array');
  }
}
