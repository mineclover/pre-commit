#!/usr/bin/env node
import { readFileSync } from 'fs';
import { loadConfig } from './config.js';
import { CommitValidator } from './validator.js';
import { getMessages, type Language } from './messages.js';

async function main() {
  try {
    const config = loadConfig();

    // Skip validation if hook is disabled
    if (!config.enabled) {
      process.exit(0);
    }

    const messages = getMessages(config.language as Language);

    // Get commit message file path from arguments
    const commitMsgFile = process.argv[2];
    if (!commitMsgFile) {
      console.error('❌ Error: Commit message file path not provided');
      process.exit(1);
    }

    // Read commit message
    let commitMsg: string;
    try {
      commitMsg = readFileSync(commitMsgFile, 'utf-8');
    } catch (error) {
      console.error(`❌ Error reading commit message file: ${commitMsgFile}`);
      process.exit(1);
    }

    // Skip validation for merge commits, revert commits, etc.
    const firstLine = commitMsg.split('\n')[0];
    if (
      firstLine.startsWith('Merge ') ||
      firstLine.startsWith('Revert ') ||
      firstLine.startsWith('Squash ')
    ) {
      console.log('✅ Special commit type detected, skipping validation');
      process.exit(0);
    }

    // Validate commit message using preset
    const validator = new CommitValidator(config);
    const result = validator.validateCommitMessage(commitMsg);

    if (!result.valid) {
      console.error(`\n❌ ${messages.commitMsgBlocked}\n`);
      console.error('━'.repeat(60));
      result.errors.forEach(err => console.error(err));
      console.error('━'.repeat(60));
      console.error(`\n📝 Your commit message:\n   "${commitMsg.trim()}"\n`);
      console.error(`\n📋 Current preset: ${validator.getPresetName()}`);
      console.error(`   ${validator.getPresetDescription()}\n`);
      process.exit(1);
    }

    console.log(`✅ Commit message format valid`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Commit-msg hook error:', error);
    process.exit(1);
  }
}

main();
