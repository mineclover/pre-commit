#!/usr/bin/env node
import { simpleGit } from 'simple-git';
import { writeFileSync } from 'fs';
import { loadConfig } from './config.js';
import { CommitValidator } from './validator.js';
import { Logger } from './logger.js';

const git = simpleGit();

interface CliOptions {
  command: string;
  args: string[];
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  return { command, args: args.slice(1) };
}

function printHelp() {
  console.log(`
Pre-commit Folder Enforcer CLI

Usage:
  precommit <command> [options]

Commands:
  check           Validate current staged files without committing
  status          Show current configuration and staged files status
  init            Initialize .precommitrc.json with defaults
  config          Show current configuration
  cleanup         Clean up log files
  logs            Show log statistics
  help            Show this help message

Examples:
  precommit check                    # Check if staged files pass validation
  precommit status                   # Show detailed status
  precommit init                     # Create default config file
  precommit config                   # Display current config
  precommit cleanup                  # Clean up old log files
  precommit cleanup --all            # Clean up all log files
  precommit logs                     # Show log file info
`);
}

async function checkCommand() {
  try {
    const config = loadConfig();
    const status = await git.status();
    const stagedFiles = Array.from(new Set([
      ...status.staged,
      ...status.created,
      ...status.renamed.map(r => r.to)
    ]));

    if (stagedFiles.length === 0) {
      console.log('ℹ️  No files staged for commit');
      return;
    }

    const validator = new CommitValidator(config);
    const result = validator.validate(stagedFiles);

    console.log('\n📋 Validation Check\n');
    console.log('━'.repeat(60));
    console.log(`Staged files: ${stagedFiles.length}`);
    console.log(`Depth setting: ${config.depth}`);
    console.log('━'.repeat(60));

    if (result.valid) {
      console.log('✅ PASSED - All files are in the same folder');
      if (result.commonPath) {
        console.log(`📁 Common path: [${result.commonPath}]`);
        console.log(`📝 Commit prefix: ${validator.getCommitPrefix(result.commonPath)}`);
      }
      console.log('\n Files:');
      stagedFiles.forEach(f => console.log(`   - ${f}`));
    } else {
      console.log('❌ FAILED - Folder rule violation\n');
      result.errors.forEach(err => console.log(err));
    }
    console.log('━'.repeat(60) + '\n');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

async function statusCommand() {
  try {
    const config = loadConfig();
    const status = await git.status();
    const stagedFiles = Array.from(new Set([
      ...status.staged,
      ...status.created,
      ...status.renamed.map(r => r.to)
    ]));

    console.log('\n📊 Status Report\n');
    console.log('━'.repeat(60));
    console.log('Configuration:');
    console.log(`  - Enabled: ${config.enabled ? '✅' : '❌'}`);
    console.log(`  - Depth: ${config.depth}`);
    console.log(`  - Log file: ${config.logFile}`);
    console.log(`  - Ignored paths: ${config.ignorePaths.length} entries`);
    console.log('━'.repeat(60));
    console.log('Git Status:');
    console.log(`  - Current branch: ${status.current || 'unknown'}`);
    console.log(`  - Staged files: ${stagedFiles.length}`);
    console.log(`  - Modified files: ${status.modified.length}`);
    console.log(`  - Untracked files: ${status.not_added.length}`);
    console.log('━'.repeat(60));

    if (stagedFiles.length > 0) {
      console.log('Staged files:');
      stagedFiles.forEach(f => console.log(`  - ${f}`));
      console.log('━'.repeat(60));
    }

    console.log('\n');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

function configCommand() {
  try {
    const config = loadConfig();
    console.log('\n⚙️  Current Configuration\n');
    console.log(JSON.stringify(config, null, 2));
    console.log('\n');
  } catch (error) {
    console.error('Error loading config:', error);
    process.exit(1);
  }
}

function initCommand() {
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

function cleanupCommand() {
  try {
    const config = loadConfig();
    const logger = new Logger(config.logFile, config.logMaxAgeHours);
    const args = process.argv.slice(2);
    const cleanAll = args.includes('--all');

    console.log('\n🗑️  Log Cleanup\n');
    console.log('━'.repeat(60));

    let deletedCount: number;
    if (cleanAll) {
      deletedCount = logger.cleanupAll();
      console.log(`Cleaned up all log files: ${deletedCount} file(s) deleted`);
    } else {
      deletedCount = logger.cleanupOldLogs();
      console.log(`Cleaned up old log files (>${config.logMaxAgeHours}h): ${deletedCount} file(s) deleted`);
    }

    console.log('━'.repeat(60) + '\n');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

function logsCommand() {
  try {
    const config = loadConfig();
    const logger = new Logger(config.logFile, config.logMaxAgeHours);
    const stats = logger.getStats();

    console.log('\n📊 Log File Statistics\n');
    console.log('━'.repeat(60));

    if (stats.exists) {
      console.log(`Status: ✅ Log file exists`);
      console.log(`Path: ${config.logFile}`);
      console.log(`Size: ${stats.size} bytes`);
      console.log(`Age: ${Math.floor(stats.age! / 1000 / 60)} minutes`);
      console.log(`Modified: ${stats.modified}`);
      console.log(`Max age setting: ${config.logMaxAgeHours} hours`);

      if (stats.age! > (config.logMaxAgeHours! * 60 * 60 * 1000)) {
        console.log(`⚠️  Log is older than configured max age`);
      }
    } else {
      console.log(`Status: ✅ No active log file (all clean)`);
      console.log(`Path: ${config.logFile}`);
    }

    console.log('━'.repeat(60) + '\n');
  } catch (error) {
    console.error('Error getting log stats:', error);
    process.exit(1);
  }
}

async function main() {
  const { command } = parseArgs();

  switch (command) {
    case 'check':
      await checkCommand();
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
    case 'cleanup':
      cleanupCommand();
      break;
    case 'logs':
      logsCommand();
      break;
    case 'help':
    default:
      printHelp();
      break;
  }
}

main();
