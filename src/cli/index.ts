#!/usr/bin/env node
/**
 * @module cli
 * @description Command-line interface for pre-commit validation and analysis
 *
 * This module provides a comprehensive CLI tool for managing and monitoring
 * the pre-commit validation system. It includes commands for:
 * - Validating staged files before commit
 * - Checking configuration and system status
 * - Managing log files and cleanup
 * - Analyzing commit history statistics
 * - Initializing new configurations
 *
 * @example
 * ```bash
 * precommit check          # Validate staged files
 * precommit status         # Show current status
 * precommit stats          # Show commit statistics
 * precommit cleanup        # Clean up old logs
 * ```
 */

import {
  helpCommand,
  versionCommand,
  checkCommand,
  statusCommand,
  configCommand,
  initCommand,
  validateConfigCommand,
  cleanupCommand,
  logsCommand,
  statsCommand,
  installCommand,
  type CliOptions
} from './commands/index.js';

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);

  // Handle --version or -v flag
  if (args.includes('--version') || args.includes('-v')) {
    return { command: 'version', args: [] };
  }

  const command = args[0] || 'help';
  return { command, args: args.slice(1) };
}

async function main(): Promise<void> {
  const { command, args } = parseArgs();

  switch (command) {
    case 'version':
      versionCommand();
      break;
    case 'check':
      await checkCommand(args);
      break;
    case 'status':
      await statusCommand();
      break;
    case 'config':
      configCommand();
      break;
    case 'init':
      initCommand();
      break;
    case 'validate-config':
      validateConfigCommand();
      break;
    case 'cleanup':
      cleanupCommand();
      break;
    case 'logs':
      logsCommand();
      break;
    case 'stats':
      await statsCommand();
      break;
    case 'install':
      installCommand();
      break;
    case 'help':
    default:
      helpCommand();
      break;
  }
}

main();
