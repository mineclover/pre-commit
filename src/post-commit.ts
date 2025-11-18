#!/usr/bin/env node
import { loadConfig } from './config.js';
import { Logger } from './logger.js';

async function main() {
  try {
    const config = loadConfig();

    if (!config.enabled) {
      process.exit(0);
    }

    // Clear log file on successful commit
    const logger = new Logger(config.logFile, config.logMaxAgeHours);
    logger.clear();

    // Also cleanup old archived logs
    const deletedCount = logger.cleanupOldLogs();

    if (config.verbose) {
      console.log('✅ Commit successful - logs cleared');
      if (deletedCount > 0) {
        console.log(`🗑️  Cleaned up ${deletedCount} old archived log(s)`);
      }
    } else {
      console.log('✅ Commit successful - logs cleared');
    }

    process.exit(0);
  } catch (error) {
    // Don't block on error in post-commit
    console.error('⚠️  Warning in post-commit:', error);
    process.exit(0);
  }
}

main();
