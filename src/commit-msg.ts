#!/usr/bin/env node
import { readFileSync } from 'fs';
import { loadConfig } from './config.js';
import { getMessages, formatMessage, type Language } from './messages.js';

interface CommitMsgValidationResult {
  valid: boolean;
  errors: string[];
}

class CommitMessageValidator {
  private minDescriptionLength = 3; // Minimum length for commit description
  private messages;

  constructor(language: Language = 'en') {
    this.messages = getMessages(language);
  }

  /**
   * Validate commit message format
   * Expected format: [prefix] Description
   * Valid prefixes: [folder/path], [root], [config]
   */
  validate(commitMsg: string): CommitMsgValidationResult {
    const result: CommitMsgValidationResult = {
      valid: true,
      errors: []
    };

    const trimmedMsg = commitMsg.trim();

    // Check if message is empty
    if (!trimmedMsg) {
      result.valid = false;
      result.errors.push(this.messages.commitMsgInvalid);
      result.errors.push(this.messages.commitMsgMissingPrefix);
      return result;
    }

    // Check if message starts with [prefix]
    const prefixMatch = trimmedMsg.match(/^\[([^\]]+)\]\s*(.*)$/);

    if (!prefixMatch) {
      result.valid = false;
      result.errors.push(this.messages.commitMsgInvalid);
      result.errors.push(this.messages.commitMsgMissingPrefix);
      result.errors.push('');
      result.errors.push(`✖ ${this.messages.commitMsgRule}`);
      result.errors.push(`✖ ${this.messages.commitMsgValidPrefixes}`);
      result.errors.push('');
      result.errors.push(`💡 ${this.messages.commitMsgExample}`);
      return result;
    }

    const [, prefix, description] = prefixMatch;

    // Validate prefix format (should not be empty)
    if (!prefix || prefix.trim() === '') {
      result.valid = false;
      result.errors.push(this.messages.commitMsgInvalidPrefix);
      return result;
    }

    // Check if description exists
    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      result.valid = false;
      result.errors.push(this.messages.commitMsgMissingDescription);
      result.errors.push('');
      result.errors.push(`💡 ${this.messages.commitMsgExample}`);
      return result;
    }

    // Check description length
    if (trimmedDescription.length < this.minDescriptionLength) {
      result.valid = false;
      result.errors.push(
        formatMessage(this.messages.commitMsgTooShort, { minLength: this.minDescriptionLength })
      );
      return result;
    }

    return result;
  }
}

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

    // Validate commit message
    const validator = new CommitMessageValidator(config.language as Language);
    const result = validator.validate(commitMsg);

    if (!result.valid) {
      console.error(`\n❌ ${messages.commitMsgBlocked}\n`);
      console.error('━'.repeat(60));
      result.errors.forEach(err => console.error(err));
      console.error('━'.repeat(60));
      console.error(`\n📝 Your commit message:\n   "${commitMsg.trim()}"\n`);
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
