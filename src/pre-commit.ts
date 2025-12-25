#!/usr/bin/env node
import { loadConfig } from './config.js';
import { CommitValidator } from './validator.js';
import { Logger } from './logger.js';
import { getStagedFiles } from './git-helper.js';
import { getMessages, formatMessage } from './messages.js';
import { SEPARATOR_WIDTH, SEPARATOR_CHAR } from './constants.js';
import { setVerbose, printVerbose } from './utils/console.js';
import { handleFatalError } from './utils/error.js';

async function main() {
  try {
    const config = loadConfig();

    // Set verbose mode
    setVerbose(config.verbose ?? false);
    printVerbose(`Config loaded: depth=${config.depth}, enabled=${config.enabled}`);

    if (!config.enabled) {
      printVerbose('Hook disabled, exiting');
      process.exit(0);
    }

    const messages = getMessages(config.language);
    const logger = new Logger(config.logFile, config.logMaxAgeHours);

    // Clear any previous log file (from previous failed commits)
    logger.clear();
    printVerbose('Previous log files cleared');

    // Get staged files
    const stagedFiles = await getStagedFiles();
    printVerbose(`Found ${stagedFiles.length} staged files`);

    if (stagedFiles.length === 0) {
      console.log(`⚠️  ${messages.noFilesStaged}`);
      process.exit(1);
    }

    // Validate
    const validator = new CommitValidator(config);
    const result = validator.validate(stagedFiles);

    if (!result.valid) {
      console.error(`\n❌ ${messages.commitBlocked}\n`);
      console.error(SEPARATOR_CHAR.repeat(SEPARATOR_WIDTH));
      result.errors.forEach(err => console.error(err));
      console.error(SEPARATOR_CHAR.repeat(SEPARATOR_WIDTH));
      console.error(`\n💡 ${messages.aiSummary}`);
      console.error(`   - ${formatMessage(messages.stagedFiles, { count: stagedFiles.length })}`);
      console.error(`   - ${formatMessage(messages.requiredDepth, { depth: config.depth })}`);
      console.error(`   - ${formatMessage(messages.multipleFoldersDetected, { count: result.stats.uniqueFolders })}`);
      console.error(`   - ${messages.actionRequired}\n`);

      logger.logViolation(stagedFiles, result.errors);
      process.exit(1);
    }

    // Prefix is added by prepare-commit-msg hook
    const displayPath = result.commonPath || 'root';
    console.log(`✅ ${messages.validationPassed}: ${stagedFiles.length} files in [${displayPath}]`);
    process.exit(0);
  } catch (error: unknown) {
    handleFatalError(error, 'Pre-commit hook error');
  }
}

main();
