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
    const logger = new Logger(config.logFile);
    logger.clear();

    console.log('✅ Commit successful - logs cleared');
    process.exit(0);
  } catch (error) {
    // Don't block on error in post-commit
    console.error('⚠️  Warning in post-commit:', error);
    process.exit(0);
  }
}

main();
