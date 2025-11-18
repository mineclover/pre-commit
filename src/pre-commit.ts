#!/usr/bin/env node
import { simpleGit } from 'simple-git';
import { readFileSync, writeFileSync } from 'fs';
import { loadConfig } from './config.js';
import { CommitValidator } from './validator.js';
import { Logger } from './logger.js';

const git = simpleGit();

async function main() {
  try {
    const config = loadConfig();

    if (!config.enabled) {
      process.exit(0);
    }

    const logger = new Logger(config.logFile, config.logMaxAgeHours);

    // Clear any previous log file (from previous failed commits)
    logger.clear();

    // Get staged files (remove duplicates)
    const status = await git.status();
    const stagedFiles = Array.from(new Set([
      ...status.staged,
      ...status.created,
      ...status.renamed.map(r => r.to)
    ]));

    if (stagedFiles.length === 0) {
      console.log('⚠️  No files staged for commit');
      process.exit(1);
    }

    // Validate
    const validator = new CommitValidator(config);
    const result = validator.validate(stagedFiles);

    if (!result.valid) {
      console.error('\n❌ COMMIT BLOCKED - Folder Rule Violation\n');
      console.error('━'.repeat(60));
      result.errors.forEach(err => console.error(err));
      console.error('━'.repeat(60));
      console.error('\n💡 AI-Friendly Error Summary:');
      console.error(`   - Staged files: ${stagedFiles.length}`);
      console.error(`   - Required depth: ${config.depth}`);
      console.error(`   - Multiple folders detected: ${result.errors.filter(e => e.startsWith('  [')).length}`);
      console.error('   - Action required: Unstage conflicting files\n');

      logger.logViolation(stagedFiles, result.errors);
      process.exit(1);
    }

    // Add prefix to commit message if common path exists
    if (result.commonPath) {
      const prefix = validator.getCommitPrefix(result.commonPath);
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

    console.log(`✅ Validation passed: ${stagedFiles.length} files in [${result.commonPath || 'root'}]`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Pre-commit hook error:', error);
    process.exit(1);
  }
}

main();
