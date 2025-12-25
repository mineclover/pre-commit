#!/usr/bin/env node
import { loadConfig } from './config.js';
import { Logger } from './logger.js';
import { handleWarning } from './utils/error.js';
import { getMessages } from './messages.js';

async function main() {
  try {
    const config = loadConfig();
    const messages = getMessages(config.language);

    if (!config.enabled) {
      process.exit(0);
    }

    // Clear all log files on successful commit
    const logger = new Logger(config.logFile, config.logMaxAgeHours);

    // Clean up all log files
    logger.cleanupAll();

    console.log(`✅ ${messages.commitSuccessful}`);

    process.exit(0);
  } catch (error: unknown) {
    // Don't block on error in post-commit
    handleWarning(error, 'Post-commit hook');
    process.exit(0);
  }
}

main();
