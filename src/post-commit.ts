#!/usr/bin/env node
import { loadConfig } from './config.js';
import { Logger } from './logger.js';

async function main() {
  try {
    const config = loadConfig();

    if (!config.enabled) {
      process.exit(0);
    }

    // Clear all log files on successful commit
    const logger = new Logger(config.logFile, config.logMaxAgeHours);

    // Clean up all logs (including any archives if they exist)
    const deletedCount = logger.cleanupAll();

    console.log('✅ Commit successful - logs cleared');

    process.exit(0);
  } catch (error) {
    // Don't block on error in post-commit
    console.error('⚠️  Warning in post-commit:', error);
    process.exit(0);
  }
}

main();
