#!/usr/bin/env node
/**
 * Prepare-commit-msg hook - adds commit prefix based on staged files
 */

import { readFileSync, writeFileSync } from 'fs';
import { CommitValidator } from '../core/validator.js';
import { getStagedFiles } from '../core/git-helper.js';
import { initHook, handleHookError, exitSuccess } from './utils.js';

async function main() {
  try {
    const ctx = initHook();
    if (!ctx) exitSuccess();

    const { config } = ctx;
    const commitMsgFile = process.argv[2];

    if (!commitMsgFile) {
      exitSuccess();
    }

    // Get staged files
    const stagedFiles = await getStagedFiles();

    if (stagedFiles.length === 0) {
      exitSuccess();
    }

    // Validate and get common path
    const validator = new CommitValidator(config);
    const result = validator.validate(stagedFiles);

    if (result.valid && result.commonPath !== null) {
      const allFilesIgnored = result.stats?.ignoredFiles === stagedFiles.length;
      const prefix = validator.getCommitPrefix(result.commonPath, allFilesIgnored);
      let commitMsg = readFileSync(commitMsgFile, 'utf-8');

      // Check if it's a template or empty commit
      const lines = commitMsg.split('\n');
      const firstLine = lines[0].trim();

      // Don't add prefix if:
      // - Already has a prefix
      // - Is a merge commit
      // - Is empty (will use editor)
      if (
        !firstLine.startsWith('[') &&
        !firstLine.startsWith('Merge') &&
        firstLine.length > 0
      ) {
        lines[0] = `${prefix} ${firstLine}`;
        commitMsg = lines.join('\n');
        writeFileSync(commitMsgFile, commitMsg, 'utf-8');
      }
    }

    exitSuccess();
  } catch (error) {
    // Don't block commit on error in this hook
    handleHookError('prepare-commit-msg', error, false);
  }
}

main();
