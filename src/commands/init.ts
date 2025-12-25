import { writeFileSync, existsSync } from 'fs';
import { printSuccess, printError, printWarning } from '../utils/console.js';
import {
  CONFIG_FILE,
  DEFAULT_DEPTH,
  DEFAULT_LOG_FILE,
  DEFAULT_MAX_FILES,
  DEFAULT_LOG_MAX_AGE_HOURS,
  DEFAULT_LANGUAGE
} from '../constants.js';
import { getErrorMessage } from '../utils/error.js';

export function initCommand(): void {
  const defaultConfig = {
    depth: DEFAULT_DEPTH,
    logFile: DEFAULT_LOG_FILE,
    enabled: true,
    ignorePaths: [
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      '.gitignore',
      'README.md'
    ],
    maxFiles: DEFAULT_MAX_FILES,
    verbose: false,
    logMaxAgeHours: DEFAULT_LOG_MAX_AGE_HOURS,
    language: DEFAULT_LANGUAGE
  };

  // Check if config already exists
  if (existsSync(CONFIG_FILE)) {
    printWarning(`${CONFIG_FILE} already exists. Use --force to overwrite.`);
    return;
  }

  try {
    writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    printSuccess(`Created ${CONFIG_FILE} with default configuration`);
    console.log(JSON.stringify(defaultConfig, null, 2));
  } catch (error: unknown) {
    printError(`Failed to create ${CONFIG_FILE}: ${getErrorMessage(error)}`);
    process.exit(1);
  }
}
