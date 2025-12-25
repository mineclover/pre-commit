/**
 * Init command - creates default configuration file
 */

import { writeFileSync } from 'fs';

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
    console.log('✅ Created .precommitrc.json with default configuration');
    console.log(JSON.stringify(defaultConfig, null, 2));
  } catch (error) {
    console.error('Error creating config file:', error);
    process.exit(1);
  }
}
