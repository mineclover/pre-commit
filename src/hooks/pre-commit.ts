#!/usr/bin/env node
/**
 * Pre-commit hook - validates that staged files follow folder-based rules
 */
import { readFileSync, writeFileSync } from 'fs';
import { loadConfig } from '../core/config.js';
import { CommitValidator } from '../core/validator.js';
import { Logger } from '../core/logger.js';
import { getStagedFiles } from '../core/git-helper.js';
import { getMessages, formatMessage, type Language } from '../core/messages.js';
import type { FolderBasedConfig } from '../presets/folder-based/types.js';

async function main() {
  try {
    const config = loadConfig();

    if (!config.enabled) {
      process.exit(0);
    }

    const messages = getMessages(config.language as Language);
    const logger = new Logger(config.logFile, config.logMaxAgeHours);

    // Clear any previous log file (from previous failed commits)
    logger.clear();

    // Get staged files
    const stagedFiles = await getStagedFiles();

    if (stagedFiles.length === 0) {
      console.log(`⚠️  ${messages.noFilesStaged}`);
      process.exit(1);
    }

    // Validate
    const validator = new CommitValidator(config);
    const result = validator.validate(stagedFiles);

    if (!result.valid) {
      console.error(`\n❌ ${messages.commitBlocked}\n`);
      console.error('━'.repeat(60));
      result.errors.forEach(err => console.error(err));
      console.error('━'.repeat(60));
      console.error(`\n💡 ${messages.aiSummary}`);
      console.error(`   - ${formatMessage(messages.stagedFiles, { count: stagedFiles.length })}`);
      if (config.preset === 'folder-based') {
        console.error(`   - ${formatMessage(messages.requiredDepth, { depth: (config as FolderBasedConfig).depth })}`);
      }
      console.error(`   - ${formatMessage(messages.multipleFoldersDetected, { count: result.stats?.uniqueFolders || 0 })}`);
      console.error(`   - ${messages.actionRequired}\n`);

      logger.logViolation(stagedFiles, result.errors);
      process.exit(1);
    }

    // Add prefix to commit message if common path exists
    if (result.commonPath !== null) {
      const allFilesIgnored = result.stats?.ignoredFiles === stagedFiles.length;
      const prefix = validator.getCommitPrefix(result.commonPath, allFilesIgnored);
      const commitMsgFile = process.argv[2] || '.git/COMMIT_EDITMSG';

      try {
        let commitMsg = readFileSync(commitMsgFile, 'utf-8').trim();

        // Don't add prefix if already present
        if (!commitMsg.startsWith('[')) {
          commitMsg = `${prefix} ${commitMsg}`;
          writeFileSync(commitMsgFile, commitMsg, 'utf-8');
          console.log(`✅ Commit prefix added: ${prefix}`);
        }
      } catch (err) {
        // COMMIT_EDITMSG not available yet (pre-commit stage)
        // This is fine, we'll handle it in prepare-commit-msg hook if needed
      }
    }

    const displayPath = result.commonPath || 'root';
    console.log(`✅ ${messages.validationPassed}: ${stagedFiles.length} files in [${displayPath}]`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Pre-commit hook error:', error);
    process.exit(1);
  }
}

main();
