import { readFileSync } from 'fs';
import { join } from 'path';
import type { Config } from './types.js';

const DEFAULT_CONFIG: Config = {
  depth: 2,
  logFile: '.commit-logs/violations.log',
  enabled: true,
  ignorePaths: []
};

export function loadConfig(): Config {
  try {
    const configPath = join(process.cwd(), '.precommitrc.json');
    const configContent = readFileSync(configPath, 'utf-8');
    const userConfig = JSON.parse(configContent);
    return { ...DEFAULT_CONFIG, ...userConfig };
  } catch {
    return DEFAULT_CONFIG;
  }
}
