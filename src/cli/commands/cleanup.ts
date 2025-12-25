/**
 * Cleanup command - cleans up log files
 */

import { loadConfig } from '../../core/config.js';
import { Logger } from '../../core/logger.js';

export function cleanupCommand(): void {
  try {
    const config = loadConfig();
    const logger = new Logger(config.logFile, config.logMaxAgeHours);
    const args = process.argv.slice(2);
    const cleanAll = args.includes('--all');

    console.log('\n🗑️  Log Cleanup\n');
    console.log('━'.repeat(60));

    let deletedCount: number;
    if (cleanAll) {
      deletedCount = logger.cleanupAll();
      console.log(`Cleaned up all log files: ${deletedCount} file(s) deleted`);
    } else {
      deletedCount = logger.cleanupOldLogs();
      console.log(`Cleaned up old log files (>${config.logMaxAgeHours}h): ${deletedCount} file(s) deleted`);
    }

    console.log('━'.repeat(60) + '\n');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}
