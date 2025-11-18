#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { loadConfig } from './config.js';
import { CommitValidator } from './validator.js';
import { getStagedFiles } from './git-helper.js';

async function main() {
  try {
    const config = loadConfig();

    if (!config.enabled) {
      process.exit(0);
    }

    const commitMsgFile = process.argv[2];
    if (!commitMsgFile) {
      process.exit(0);
    }

    // Get staged files
    const stagedFiles = await getStagedFiles();

    if (stagedFiles.length === 0) {
      process.exit(0);
    }

    // Validate and get common path
    const validator = new CommitValidator(config);
    const result = validator.validate(stagedFiles);

    if (result.valid && result.commonPath !== null) {
      const prefix = validator.getCommitPrefix(result.commonPath);
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

    process.exit(0);
  } catch (error) {
    // Don't block commit on error in this hook
    console.error('⚠️  Warning in prepare-commit-msg:', error);
    process.exit(0);
  }
}

main();
