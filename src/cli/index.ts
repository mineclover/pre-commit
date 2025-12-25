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

import { simpleGit } from 'simple-git';
import { writeFileSync, existsSync, mkdirSync, chmodSync } from 'fs';
import { loadConfig } from '../core/config.js';
import { CommitValidator } from '../core/validator.js';
import { Logger } from '../core/logger.js';
import { CLI_DISPLAY, HUSKY_DIR, HOOKS, CONFIG_FILE } from '../core/constants.js';
import { matchAnyGlob, isGlobPattern } from '../core/utils/glob.js';
import { getMessages, formatMessage } from '../core/messages.js';
import type { FolderBasedConfig } from '../presets/folder-based/types.js';

const git = simpleGit();

/** Get package version from package.json */
function getVersion(): string {
  return '1.5.0';
}

interface CliOptions {
  command: string;
  args: string[];
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);

  // Handle --version or -v flag
  if (args.includes('--version') || args.includes('-v')) {
    return { command: 'version', args: [] };
  }

  const command = args[0] || 'help';
  return { command, args: args.slice(1) };
}

/** Parse --files argument for dry-run validation */
function parseFilesArg(args: string[]): string[] | null {
  const filesIndex = args.indexOf('--files');
  if (filesIndex === -1 || filesIndex + 1 >= args.length) {
    return null;
  }
  return args[filesIndex + 1]
    .split(',')
    .map(f => f.trim())
    .filter(f => f.length > 0);
}

function printHelp() {
  console.log(`
Pre-commit Folder Enforcer CLI

Usage:
  precommit <command> [options]
  precommit --version              Show version

Commands:
  check           Validate current staged files without committing
  status          Show current configuration and staged files status
  init            Initialize .precommitrc.json with defaults
  config          Show current configuration
  validate-config Validate configuration file and check for issues
  cleanup         Clean up log files
  logs            Show log statistics
  stats           Show commit history statistics
  install         Install husky hooks (pre-commit, prepare-commit-msg, commit-msg, post-commit)
  help            Show this help message

Examples:
  precommit check                          # Check if staged files pass validation
  precommit check --files "a.ts,b.ts"      # Dry-run validation with specific files
  precommit status                         # Show detailed status
  precommit init                           # Create default config file
  precommit config                         # Display current config
  precommit validate-config                # Validate config file
  precommit cleanup                        # Clean up old log files
  precommit cleanup --all                  # Clean up all log files
  precommit logs                           # Show log file info
  precommit stats                          # Show commit prefix statistics
  precommit stats --last 50                # Show stats for last 50 commits
  precommit install                        # Install husky hooks
  precommit --version                      # Show version
`);
}

async function checkCommand(args: string[] = []) {
  try {
    const config = loadConfig();
    const messages = getMessages(config.language);

    // Check for --files argument (dry-run mode)
    const customFiles = parseFilesArg(args);
    const isDryRun = customFiles !== null;

    let stagedFiles: string[];
    if (isDryRun) {
      stagedFiles = customFiles;
    } else {
      const status = await git.status();
      stagedFiles = Array.from(new Set([
        ...status.staged,
        ...status.created,
        ...status.renamed.map(r => r.to)
      ]));
    }

    if (stagedFiles.length === 0) {
      console.log(`ℹ️  ${messages.noFilesStaged}`);
      return;
    }

    const validator = new CommitValidator(config);
    const result = validator.validate(stagedFiles);
    const folderConfig = config as FolderBasedConfig;

    console.log(`\n📋 ${isDryRun ? 'Validation Check (Dry Run)' : 'Validation Check'}\n`);
    console.log('━'.repeat(60));
    console.log(`Preset: ${config.preset}`);
    console.log(`${isDryRun ? messages.testFiles : 'Staged files'}: ${stagedFiles.length}`);
    if (config.preset === 'folder-based') {
      console.log(`${messages.depthSetting}: ${folderConfig.depth}`);
    }
    console.log('━'.repeat(60));

    // Show ignored files if any
    const ignoredFiles = stagedFiles.filter(f => matchAnyGlob(f, folderConfig.ignorePaths || []));
    if (ignoredFiles.length > 0) {
      console.log(`\n📝 ${messages.ignoredFiles} (${ignoredFiles.length}):`);
      ignoredFiles.forEach(f => console.log(`   - ${f}`));
      console.log('');
    }

    if (result.valid) {
      console.log(`✅ ${messages.checkPassed}`);
      if (result.commonPath !== undefined && result.commonPath !== null) {
        console.log(`📁 ${messages.commonPath}: [${result.commonPath || 'root'}]`);
        console.log(`📝 ${messages.commitPrefix}: ${validator.getCommitPrefix(result.commonPath || '')}`);
      }
      const validatedFiles = stagedFiles.filter(f => !ignoredFiles.includes(f));
      if (validatedFiles.length > 0) {
        console.log(`\n📄 ${messages.validatedFiles}:`);
        validatedFiles.forEach(f => console.log(`   - ${f}`));
      }
    } else {
      console.log(`❌ ${messages.checkFailed}\n`);
      result.errors.forEach(err => console.log(err));
    }

    if (isDryRun) {
      console.log('');
      console.log(`⚠️  ${messages.dryRunWarning}`);
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
    console.log(`  - Preset: ${config.preset}`);
    console.log(`  - Enabled: ${config.enabled ? '✅' : '❌'}`);
    if (config.preset === 'folder-based') {
      const folderConfig = config as FolderBasedConfig;
      console.log(`  - Depth: ${folderConfig.depth}`);
      console.log(`  - Ignored paths: ${folderConfig.ignorePaths.length} entries`);
    }
    console.log(`  - Log file: ${config.logFile}`);
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

async function statsCommand() {
  try {
    const args = process.argv.slice(2);
    const lastIndex = args.indexOf('--last');
    const count = lastIndex !== -1 ? parseInt(args[lastIndex + 1]) || 20 : 20;

    const git = simpleGit();
    const log = await git.log({ maxCount: count });

    console.log(`\n📊 Commit Prefix Statistics (last ${count} commits)\n`);
    console.log('━'.repeat(60));

    // Parse prefixes
    const prefixes: Record<string, number> = {};
    const noPrefixCommits: string[] = [];

    log.all.forEach(commit => {
      const match = commit.message.match(/^\[([^\]]+)\]/);
      if (match) {
        const prefix = match[1];
        prefixes[prefix] = (prefixes[prefix] || 0) + 1;
      } else {
        noPrefixCommits.push(commit.message.substring(0, 50));
      }
    });

    // Sort by count
    const sorted = Object.entries(prefixes).sort((a, b) => b[1] - a[1]);

    console.log('Prefix distribution:');
    sorted.forEach(([prefix, count]) => {
      const percentage = ((count / log.all.length) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(count / CLI_DISPLAY.BAR_SCALE_FACTOR));
      console.log(`  [${prefix.padEnd(20)}] ${count.toString().padStart(3)} (${percentage}%) ${bar}`);
    });

    if (noPrefixCommits.length > 0) {
      console.log(`\n⚠️  Commits without prefix: ${noPrefixCommits.length}`);
      if (noPrefixCommits.length <= CLI_DISPLAY.MAX_COMMITS_TO_SHOW) {
        noPrefixCommits.forEach(msg => console.log(`    - ${msg}`));
      }
    }

    console.log('━'.repeat(60));
    console.log(`Total analyzed: ${log.all.length} commits`);
    console.log(`With prefix: ${log.all.length - noPrefixCommits.length}`);
    console.log(`Without prefix: ${noPrefixCommits.length}`);
    console.log('━'.repeat(60) + '\n');
  } catch (error) {
    console.error('Error generating stats:', error);
    process.exit(1);
  }
}

function validateConfigCommand() {
  let messages = getMessages('en');
  try {
    const tempConfig = loadConfig();
    messages = getMessages(tempConfig.language);
  } catch {
    // Use default messages
  }

  console.log('\n🔍 Configuration Validation\n');
  console.log('━'.repeat(60));

  // Check if config file exists
  if (!existsSync(CONFIG_FILE)) {
    console.log(`⚠️  ${formatMessage(messages.configNotFound, { file: CONFIG_FILE })}`);
    console.log(`\n${messages.defaultConfig}:`);
    const defaultConfig = {
      preset: 'folder-based',
      depth: 2,
      logFile: '.commit-logs/violations.log',
      enabled: true,
      ignorePaths: ['package.json', 'package-lock.json', 'tsconfig.json', '.gitignore', 'README.md']
    };
    console.log(JSON.stringify(defaultConfig, null, 2));
    console.log('━'.repeat(60));
    console.log(`ℹ️  ${messages.runInit}`);
    return;
  }

  try {
    const config = loadConfig();
    messages = getMessages(config.language);
    console.log(`✅ ${messages.configValid}`);
    console.log('');

    const folderConfig = config as FolderBasedConfig;
    let missingPaths = 0;
    let validPaths = 0;
    let globPatterns = 0;

    if (folderConfig.ignorePaths && folderConfig.ignorePaths.length > 0) {
      console.log(`${messages.ignoredPaths}:`);
      for (const ignorePath of folderConfig.ignorePaths) {
        if (isGlobPattern(ignorePath)) {
          console.log(`  🔍 ${ignorePath} (${messages.globPattern})`);
          globPatterns++;
        } else if (existsSync(ignorePath)) {
          console.log(`  ✅ ${ignorePath}`);
          validPaths++;
        } else {
          console.log(`  ⚠️  ${ignorePath} (${messages.notFound})`);
          missingPaths++;
        }
      }
      console.log('');
    }

    console.log(`${messages.summary}:`);
    console.log(`  - ${messages.depthSetting.split(':')[0]}: ${folderConfig.depth}`);
    console.log(`  - ${messages.maxFilesLabel}: ${folderConfig.maxFiles ?? messages.unlimited}`);
    console.log(`  - ${messages.languageLabel}: ${config.language ?? 'en'}`);
    console.log(`  - ${messages.verboseLabel}: ${folderConfig.verbose ? messages.enabled : messages.disabled}`);
    console.log(`  - ${messages.logFileLabel}: ${config.logFile}`);

    const pathSummary = [];
    if (validPaths > 0) pathSummary.push(formatMessage(messages.pathsValid, { count: validPaths }));
    if (globPatterns > 0) pathSummary.push(formatMessage(messages.pathsPatterns, { count: globPatterns }));
    if (missingPaths > 0) pathSummary.push(formatMessage(messages.pathsMissing, { count: missingPaths }));
    console.log(`  - ${messages.ignoredPaths}: ${pathSummary.join(', ') || messages.pathsNone}`);

    if (missingPaths > 0) {
      console.log('');
      console.log(`⚠️  ${formatMessage(messages.missingPathsWarning, { count: missingPaths })}`);
    }

    console.log('━'.repeat(60) + '\n');
  } catch (error) {
    console.error(`❌ ${messages.configError}: ${error}`);
    process.exit(1);
  }
}

function installCommand() {
  let messages = getMessages('en');
  try {
    const config = loadConfig();
    messages = getMessages(config.language);
  } catch {
    // Use default messages
  }

  console.log('\n🔧 Installing Husky Hooks\n');
  console.log('━'.repeat(60));

  try {
    // Create .husky directory if not exists
    if (!existsSync(HUSKY_DIR)) {
      mkdirSync(HUSKY_DIR, { recursive: true });
      console.log(`📁 ${messages.createdHuskyDir}`);
    }

    // Write each hook file
    for (const [hookName, content] of Object.entries(HOOKS)) {
      const hookPath = `${HUSKY_DIR}/${hookName}`;

      try {
        writeFileSync(hookPath, content + '\n', 'utf-8');
        chmodSync(hookPath, 0o755);
        console.log(`✅ Installed ${hookName}`);
      } catch (error) {
        console.error(`❌ Failed to install ${hookName}: ${error}`);
        process.exit(1);
      }
    }

    console.log('━'.repeat(60));
    console.log('');
    console.log('✅ Husky hooks installed successfully!\n');
    console.log(`${messages.nextSteps}:`);
    console.log(`  1. ${messages.installStep1}`);
    console.log(`  2. ${messages.installStep2}`);
    console.log(`  3. ${messages.installStep3}\n`);
  } catch (error) {
    console.error(`❌ Failed to create ${HUSKY_DIR}: ${error}`);
    process.exit(1);
  }
}

function versionCommand() {
  console.log(`pre-commit-folder-enforcer v${getVersion()}`);
}

async function main() {
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
      printHelp();
      break;
  }
}

main();
