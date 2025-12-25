#!/usr/bin/env node
/**
 * Post-commit hook - cleans up log files after successful commit
 */

import { Logger } from '../core/logger.js';
import { initHook, handleHookError, exitSuccess } from './utils.js';

async function main() {
  try {
    const ctx = initHook();
    if (!ctx) exitSuccess();

    const { config } = ctx;

    // Clear all log files on successful commit
    const logger = new Logger(config.logFile, config.logMaxAgeHours);
    logger.cleanupAll();

    console.log('✅ Commit successful - logs cleared');
    exitSuccess();
  } catch (error) {
    // Don't block on error in post-commit
    handleHookError('post-commit', error, false);
  }
}

main();
