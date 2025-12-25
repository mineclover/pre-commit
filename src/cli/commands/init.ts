/**
 * Init command - creates default configuration file
 */

import { writeFileSync } from 'fs';
import { printSuccess, printError } from '../../core/utils/console.js';

export function initCommand(): void {
  const defaultConfig = {
    depth: 2,
    logFile: '.commit-logs/violations.log',
    enabled: true,
    ignorePaths: [
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      '.gitignore',
      'README.md'
    ]
  };

  try {
    writeFileSync('.precommitrc.json', JSON.stringify(defaultConfig, null, 2), 'utf-8');
    printSuccess('Created .precommitrc.json with default configuration');
    console.log(JSON.stringify(defaultConfig, null, 2));
  } catch (error) {
    printError(`Error creating config file: ${error}`);
    process.exit(1);
  }
}
