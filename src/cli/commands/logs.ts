/**
 * Logs command - shows log file statistics
 */

import { loadConfig } from '../../core/config.js';
import { Logger } from '../../core/logger.js';

export function logsCommand(): void {
  try {
    const config = loadConfig();
    const logger = new Logger(config.logFile, config.logMaxAgeHours);
    const stats = logger.getStats();

    console.log('\n📊 Log File Statistics\n');
    console.log('━'.repeat(60));

    if (stats.exists) {
      console.log(`Status: ✅ Log file exists`);
      console.log(`Path: ${config.logFile}`);
      console.log(`Size: ${stats.size} bytes`);
      console.log(`Age: ${Math.floor(stats.age! / 1000 / 60)} minutes`);
      console.log(`Modified: ${stats.modified}`);
      console.log(`Max age setting: ${config.logMaxAgeHours} hours`);

      if (stats.age! > (config.logMaxAgeHours! * 60 * 60 * 1000)) {
        console.log(`⚠️  Log is older than configured max age`);
      }
    } else {
      console.log(`Status: ✅ No active log file (all clean)`);
      console.log(`Path: ${config.logFile}`);
    }

    console.log('━'.repeat(60) + '\n');
  } catch (error) {
    console.error('Error getting log stats:', error);
    process.exit(1);
  }
}
