import { loadConfig } from '../config.js';
import { Logger } from '../logger.js';
import { printHeader, printFooter } from '../utils/console.js';
import { getMessages } from '../messages.js';

export function logsCommand(): void {
  const config = loadConfig();
  const messages = getMessages(config.language);
  const logger = new Logger(config.logFile, config.logMaxAgeHours);
  const stats = logger.getStats();

  printHeader('Log File Statistics', '📊');

  if (stats.exists) {
    console.log(`Status: ✅ ${messages.logExists}`);
    console.log(`${messages.path}: ${config.logFile}`);
    console.log(`${messages.size}: ${stats.size} ${messages.bytes}`);
    console.log(`${messages.age}: ${Math.floor(stats.age / 1000 / 60)} ${messages.minutes}`);
    console.log(`${messages.modified}: ${stats.modified}`);
    console.log(`${messages.maxAgeSetting}: ${config.logMaxAgeHours} ${messages.hours}`);

    const maxAgeMs = (config.logMaxAgeHours ?? 24) * 60 * 60 * 1000;
    if (stats.age > maxAgeMs) {
      console.log(`⚠️  ${messages.logOlderThanMax}`);
    }
  } else {
    console.log(`Status: ✅ ${messages.logClean}`);
    console.log(`${messages.path}: ${config.logFile}`);
  }

  printFooter();
}
