#!/usr/bin/env node
/**
 * Commit-msg hook - validates commit message format
 */

import { readFileSync } from 'fs';
import { CommitValidator } from '../core/validator.js';
import { getMessages, type Language } from '../core/messages.js';
import { SPECIAL_COMMIT_TYPES } from '../core/constants.js';
import { initHook, handleHookError, exitSuccess, exitFailure } from './utils.js';

async function main() {
  try {
    const ctx = initHook();
    if (!ctx) exitSuccess();

    const { config } = ctx;
    const messages = getMessages(config.language as Language);

    // Get commit message file path from arguments
    const commitMsgFile = process.argv[2];
    if (!commitMsgFile) {
      console.error('❌ Error: Commit message file path not provided');
      exitFailure();
    }

    // Read commit message
    let commitMsg: string;
    try {
      commitMsg = readFileSync(commitMsgFile, 'utf-8');
    } catch (error) {
      console.error(`❌ Error reading commit message file: ${commitMsgFile}`);
      exitFailure();
    }

    // Skip validation for merge commits, revert commits, etc.
    const firstLine = commitMsg.split('\n')[0];
    const isSpecialCommit = SPECIAL_COMMIT_TYPES.some(type => firstLine.startsWith(type));

    if (isSpecialCommit) {
      console.log('✅ Special commit type detected, skipping validation');
      exitSuccess();
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
      exitFailure();
    }

    console.log(`✅ Commit message format valid`);
    exitSuccess();
  } catch (error) {
    handleHookError('commit-msg', error, true);
  }
}

main();
